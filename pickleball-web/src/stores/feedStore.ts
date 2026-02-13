import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { FeedPost, FeedComment, ReactionType } from '@/types/database';

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  hasMore: boolean;
  comments: Record<string, FeedComment[]>;
  fetchPosts: (reset?: boolean) => Promise<void>;
  createPost: (content: string, imageUrl: string | null) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleReaction: (postId: string, reactionType: ReactionType) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  prependPost: (post: FeedPost) => void;
}

const PAGE_SIZE = 10;

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,
  comments: {},

  fetchPosts: async (reset = false) => {
    const { posts, loading } = get();
    if (loading) return;
    set({ loading: true });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const offset = reset ? 0 : posts.length;

      const { data, error } = await supabase
        .from('feed_posts')
        .select('*, profile:profiles!feed_posts_user_id_fkey(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

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

        // Fetch comment count
        const { count } = await supabase
          .from('feed_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

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

  createPost: async (content, imageUrl) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl,
    });
    if (error) throw new Error(error.message);

    // Refresh to get the new post with profile data
    await get().fetchPosts(true);
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

    // Optimistic update
    if (currentReaction === reactionType) {
      // Remove reaction
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
      // Remove old reaction count if switching
      if (currentReaction) {
        counts[currentReaction] = Math.max(0, counts[currentReaction] - 1);
      }
      counts[reactionType]++;
      const updated = [...posts];
      updated[postIndex] = { ...post, user_reaction: reactionType, reaction_counts: counts };
      set({ posts: updated });

      // Delete existing then insert new
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
    const { data, error } = await supabase
      .from('feed_comments')
      .select('*, profile:profiles!feed_comments_user_id_fkey(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    set({ comments: { ...get().comments, [postId]: data || [] } });
  },

  addComment: async (postId, content) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select('*, profile:profiles!feed_comments_user_id_fkey(full_name, avatar_url)')
      .single();

    if (error) throw new Error(error.message);

    const comments = get().comments;
    const postComments = comments[postId] || [];
    set({ comments: { ...comments, [postId]: [...postComments, data] } });

    // Update comment count on the post
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
  },

  prependPost: (post) => {
    const { posts } = get();
    // Don't add if already exists
    if (posts.some((p) => p.id === post.id)) return;
    set({ posts: [post, ...posts] });
  },
}));
