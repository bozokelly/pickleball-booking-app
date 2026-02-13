'use client';

import { useState } from 'react';
import { FeedComment } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  comments: FeedComment[];
  onAddComment: (content: string) => Promise<void>;
}

export default function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onAddComment(text);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {comment.profile?.avatar_url ? (
                  <img src={comment.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-primary">
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
                <span className="text-xs text-text-tertiary ml-3">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2 text-primary disabled:opacity-40 hover:bg-primary/10 rounded-xl transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
