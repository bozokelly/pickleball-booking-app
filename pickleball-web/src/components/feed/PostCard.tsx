'use client';

import { useState } from 'react';
import { FeedPost, FeedComment, ReactionType } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Trash2, MoreHorizontal } from 'lucide-react';

interface PostCardProps {
  post: FeedPost;
}

export default function PostCard({ post }: PostCardProps) {
  const { profile } = useAuthStore();
  const { toggleReaction, fetchComments, addComment, deletePost, comments } = useFeedStore();
  const { showToast } = useToast();

  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = profile?.id === post.user_id;
  const postComments: FeedComment[] = comments[post.id] || [];

  const handleToggleComments = async () => {
    if (!showComments && !comments[post.id]) {
      setLoadingComments(true);
      try {
        await fetchComments(post.id);
      } catch {
        showToast('Failed to load comments', 'error');
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (content: string) => {
    try {
      await addComment(post.id, content);
    } catch {
      showToast('Failed to add comment', 'error');
    }
  };

  const handleReaction = async (type: ReactionType) => {
    try {
      await toggleReaction(post.id, type);
    } catch {
      showToast('Failed to react', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      showToast('Post deleted', 'success');
    } catch {
      showToast('Failed to delete post', 'error');
    }
    setConfirmDelete(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] border border-border/30">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {post.profile?.full_name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {post.profile?.full_name || 'Unknown'}
            </p>
            <p className="text-xs text-text-tertiary">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-text-tertiary hover:text-text-secondary rounded-lg hover:bg-background transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
                    className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-background flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-text-primary whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="rounded-xl max-h-96 w-full object-cover"
        />
      )}

      {/* Reactions + Comment toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ReactionBar
          counts={post.reaction_counts || { like: 0, love: 0, fire: 0, laugh: 0 }}
          userReaction={post.user_reaction || null}
          onToggle={handleReaction}
        />
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {(post.comment_count || 0) > 0 ? post.comment_count : ''} Comments
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        loadingComments ? (
          <div className="text-center py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mx-auto" />
          </div>
        ) : (
          <CommentSection comments={postComments} onAddComment={handleAddComment} />
        )
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
