'use client';

import { useState, memo, useMemo } from 'react';
import Image from 'next/image';
import { FeedPost, FeedComment, ReactionType } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import ImageGallery from './ImageGallery';
import LinkPreview from './LinkPreview';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Club } from '@/types/database';
import { MessageCircle, Trash2, MoreHorizontal, Users } from 'lucide-react';

const URL_REGEX = /https?:\/\/[^\s<>)"']+/g;

interface PostCardProps {
  post: FeedPost;
}

function PostCard({ post }: PostCardProps) {
  const { profile } = useAuthStore();
  const { toggleReaction, fetchComments, addComment, deletePost, deleteComment, comments } = useFeedStore();
  const { showToast } = useToast();

  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = profile?.id === post.user_id;
  const postComments: FeedComment[] = comments[post.id] || [];

  // Resolve images: prefer image_urls array, fall back to single image_url
  const images = useMemo(() => {
    if (post.image_urls && post.image_urls.length > 0) return post.image_urls;
    if (post.image_url) return [post.image_url];
    return [];
  }, [post.image_urls, post.image_url]);

  // Detect the first URL in post content for link preview
  const firstUrl = useMemo(() => {
    if (!post.content) return null;
    const match = post.content.match(URL_REGEX);
    return match ? match[0] : null;
  }, [post.content]);

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

  const handleAddComment = async (content: string, parentId?: string | null) => {
    try {
      await addComment(post.id, content, parentId);
    } catch {
      showToast('Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    try {
      await deleteComment(post.id, commentId, parentId);
      showToast('Comment deleted', 'success');
    } catch {
      showToast('Failed to delete comment', 'error');
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
              <Image src={post.profile.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
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
            <div className="flex items-center gap-2 mt-0.5">
              {post.club && (
                <Link
                  href={`/dashboard/club/${(post.club as Club).id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded-full hover:bg-primary/15 transition-colors"
                >
                  <Users className="h-3 w-3" />
                  {(post.club as Club).name}
                </Link>
              )}
              <p className="text-xs text-text-tertiary">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
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

      {/* Images */}
      {images.length > 0 && <ImageGallery images={images} />}

      {/* Link Preview */}
      {firstUrl && <LinkPreview url={firstUrl} />}

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
          <CommentSection comments={postComments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} currentUserId={profile?.id} />
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

export default memo(PostCard);
