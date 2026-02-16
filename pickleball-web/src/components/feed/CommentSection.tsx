'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FeedComment } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Send, Reply, Trash2 } from 'lucide-react';

interface CommentSectionProps {
  comments: FeedComment[];
  onAddComment: (content: string, parentId?: string | null) => Promise<void>;
  onDeleteComment?: (commentId: string, parentId?: string | null) => Promise<void>;
  currentUserId?: string;
}

export default function CommentSection({ comments, onAddComment, onDeleteComment, currentUserId }: CommentSectionProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onAddComment(text, replyingTo?.id || null);
      setText('');
      setReplyingTo(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={(id, name) => {
                setReplyingTo({ id, name });
              }}
              onDeleteComment={onDeleteComment}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
          <Reply className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary">
            Replying to <span className="font-medium">{replyingTo.name}</span>
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-xs text-text-tertiary hover:text-text-secondary ml-auto"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Write a comment...'}
          className="flex-1 min-w-0 px-3 py-2 bg-background/60 border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2 text-primary disabled:opacity-40 hover:bg-primary/10 rounded-xl transition-colors flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function CommentThread({
  comment,
  onReply,
  onDeleteComment,
  currentUserId,
}: {
  comment: FeedComment;
  onReply: (id: string, name: string) => void;
  onDeleteComment?: (commentId: string, parentId?: string | null) => Promise<void>;
  currentUserId?: string;
}) {
  return (
    <div>
      <SingleComment comment={comment} onReply={onReply} onDeleteComment={onDeleteComment} currentUserId={currentUserId} />
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-1.5 space-y-1.5 border-l-2 border-border/50 pl-3">
          {comment.replies.map((reply) => (
            <SingleComment key={reply.id} comment={reply} onReply={onReply} isReply parentId={comment.id} onDeleteComment={onDeleteComment} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function SingleComment({
  comment,
  onReply,
  isReply = false,
  parentId,
  onDeleteComment,
  currentUserId,
}: {
  comment: FeedComment;
  onReply: (id: string, name: string) => void;
  isReply?: boolean;
  parentId?: string;
  onDeleteComment?: (commentId: string, parentId?: string | null) => Promise<void>;
  currentUserId?: string;
}) {
  const isOwner = currentUserId && comment.user_id === currentUserId;

  return (
    <div className="flex gap-2 group">
      <div className={`${isReply ? 'h-6 w-6' : 'h-7 w-7'} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
        {comment.profile?.avatar_url ? (
          <Image src={comment.profile.avatar_url} alt="" width={isReply ? 24 : 28} height={isReply ? 24 : 28} className={`${isReply ? 'h-6 w-6' : 'h-7 w-7'} rounded-full object-cover`} />
        ) : (
          <span className={`${isReply ? 'text-[10px]' : 'text-xs'} font-semibold text-primary`}>
            {comment.profile?.full_name?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-background rounded-xl px-3 py-2">
          <span className="text-sm font-medium text-text-primary">
            {comment.profile?.full_name || 'Unknown'}
          </span>
          <p className="text-sm text-text-secondary">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 ml-3 mt-0.5">
          <span className="text-xs text-text-tertiary">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {!isReply && (
            <button
              onClick={() => onReply(comment.id, comment.profile?.full_name || 'Unknown')}
              className="text-xs text-text-tertiary hover:text-primary transition-colors font-medium"
            >
              Reply
            </button>
          )}
          {isOwner && onDeleteComment && (
            <button
              onClick={() => onDeleteComment(comment.id, parentId || null)}
              className="text-xs text-text-tertiary hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
