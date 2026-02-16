import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { FeedPost, FeedComment, ReactionType } from '@/types/database';

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  hasMore: boolean;
  comments: Record<string, FeedComment[]>;
  currentClubId: string | null;
  fetchPosts: (reset?: boolean, clubId?: string | null) => Promise<void>;
  createPost: (content: string, imageUrl: string | null, clubId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleReaction: (postId: string, reactionType: ReactionType) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string | null) => Promise<void>;
  deleteComment: (postId: string, commentId: string, parentId?: string | null) => Promise<void>;
  prependPost: (post: FeedPost) => void;
}

const PAGE_SIZE = 10;

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,
  comments: {},
  currentClubId: null,

  fetchPosts: async (reset = false, clubId = null) => {
    const { posts, loading } = get();
    if (loading) return;
    set({ loading: true, currentClubId: clubId });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const offset = reset ? 0 : posts.length;

      let query = supabase
        .from('feed_posts')
        .select('*, profile:profiles!feed_posts_user_id_fkey(full_name, avatar_url), club:clubs!feed_posts_club_id_fkey(id, name, image_url)')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      const postsWithMeta: FeedPost[] = [];

      for (const post of data || []) {
        // Fetch reaction counts
        const { data: reactions } = await supabase
          .from('feed_reactions')
          .select('reaction_type')
          .eq('post_id', post.id);

        const counts: Record<ReactionType, number> = { like: 0, love: 0, fire: 0, laugh: 0 };
        for (const r of reactions || []) {
          counts[r.reaction_type as ReactionType]++;
        }

        // Fetch user's reaction
        let userReaction: ReactionType | null = null;
        if (user) {
          const { data: myReaction } = await supabase
            .from('feed_reactions')
            .select('reaction_type')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userReaction = myReaction?.reaction_type as ReactionType | null;
        }

        // Fetch comment count (top-level only)
        const { count } = await supabase
          .from('feed_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .is('parent_id', null);

        postsWithMeta.push({
          ...post,
          reaction_counts: counts,
          user_reaction: userReaction,
          comment_count: count || 0,
        });
      }

      set({
        posts: reset ? postsWithMeta : [...posts, ...postsWithMeta],
        hasMore: (data?.length || 0) === PAGE_SIZE,
      });
    } finally {
      set({ loading: false });
    }
  },

  createPost: async (content, imageUrl, clubId) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      club_id: clubId,
      content: content.trim(),
      image_url: imageUrl,
    });
    if (error) throw new Error(error.message);

    // Refresh to get the new post with profile + club data
    await get().fetchPosts(true, get().currentClubId);
  },

  deletePost: async (postId) => {
    const { error } = await supabase.from('feed_posts').delete().eq('id', postId);
    if (error) throw new Error(error.message);
    set({ posts: get().posts.filter((p) => p.id !== postId) });
  },

  toggleReaction: async (postId, reactionType) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const posts = get().posts;
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const currentReaction = post.user_reaction;
    const counts = { ...(post.reaction_counts || { like: 0, love: 0, fire: 0, laugh: 0 }) };

    if (currentReaction === reactionType) {
      counts[reactionType] = Math.max(0, counts[reactionType] - 1);
      const updated = [...posts];
      updated[postIndex] = { ...post, user_reaction: null, reaction_counts: counts };
      set({ posts: updated });

      await supabase
        .from('feed_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      if (currentReaction) {
        counts[currentReaction] = Math.max(0, counts[currentReaction] - 1);
      }
      counts[reactionType]++;
      const updated = [...posts];
      updated[postIndex] = { ...post, user_reaction: reactionType, reaction_counts: counts };
      set({ posts: updated });

      await supabase
        .from('feed_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      await supabase.from('feed_reactions').insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType,
      });
    }
  },

  fetchComments: async (postId) => {
    // Fetch all comments (top-level and replies) for this post
    const { data, error } = await supabase
      .from('feed_comments')
      .select('*, profile:profiles!feed_comments_user_id_fkey(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Build threaded structure
    const allComments = data || [];
    const topLevel: FeedComment[] = [];
    const repliesMap: Record<string, FeedComment[]> = {};

    for (const c of allComments) {
      if (c.parent_id) {
        if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
        repliesMap[c.parent_id].push(c);
      } else {
        topLevel.push({ ...c, replies: [] });
      }
    }

    // Attach replies to their parent
    for (const comment of topLevel) {
      comment.replies = repliesMap[comment.id] || [];
    }

    set({ comments: { ...get().comments, [postId]: topLevel } });
  },

  addComment: async (postId, content, parentId = null) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      })
      .select('*, profile:profiles!feed_comments_user_id_fkey(full_name, avatar_url)')
      .single();

    if (error) throw new Error(error.message);

    const comments = get().comments;
    const postComments = [...(comments[postId] || [])];

    if (parentId) {
      // Add as reply to parent
      const parentIndex = postComments.findIndex((c) => c.id === parentId);
      if (parentIndex !== -1) {
        const parent = { ...postComments[parentIndex] };
        parent.replies = [...(parent.replies || []), data];
        postComments[parentIndex] = parent;
      }
    } else {
      // Add as top-level comment
      postComments.push({ ...data, replies: [] });
    }

    set({ comments: { ...comments, [postId]: postComments } });

    // Update comment count on the post (only for top-level)
    if (!parentId) {
      const posts = get().posts;
      const postIndex = posts.findIndex((p) => p.id === postId);
      if (postIndex !== -1) {
        const updated = [...posts];
        updated[postIndex] = {
          ...updated[postIndex],
          comment_count: (updated[postIndex].comment_count || 0) + 1,
        };
        set({ posts: updated });
      }
    }
  },

  deleteComment: async (postId, commentId, parentId = null) => {
    const { error } = await supabase.from('feed_comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);

    const comments = get().comments;
    const postComments = [...(comments[postId] || [])];

    if (parentId) {
      const parentIndex = postComments.findIndex((c) => c.id === parentId);
      if (parentIndex !== -1) {
        const parent = { ...postComments[parentIndex] };
        parent.replies = (parent.replies || []).filter((r) => r.id !== commentId);
        postComments[parentIndex] = parent;
      }
    } else {
      const idx = postComments.findIndex((c) => c.id === commentId);
      if (idx !== -1) postComments.splice(idx, 1);

      // Decrement comment count on the post
      const posts = get().posts;
      const postIndex = posts.findIndex((p) => p.id === postId);
      if (postIndex !== -1) {
        const updated = [...posts];
        updated[postIndex] = {
          ...updated[postIndex],
          comment_count: Math.max(0, (updated[postIndex].comment_count || 0) - 1),
        };
        set({ posts: updated });
      }
    }

    set({ comments: { ...comments, [postId]: postComments } });
  },

  prependPost: (post) => {
    const { posts } = get();
    if (posts.some((p) => p.id === post.id)) return;
    set({ posts: [post, ...posts] });
  },
}));
