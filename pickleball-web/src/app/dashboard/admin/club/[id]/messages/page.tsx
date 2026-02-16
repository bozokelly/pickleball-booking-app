'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useClubMessageStore } from '@/stores/clubMessageStore';
import { Card, Button } from '@/components/ui';
import { ClubMessage } from '@/types/database';
import { ArrowLeft, MessageSquare, Send, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ClubMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { messages, loading, fetchClubMessages, replyToMessage, markMessageRead } = useClubMessageStore();

  useEffect(() => {
    fetchClubMessages(clubId);
  }, [clubId, fetchClubMessages]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-primary hover:underline">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Club Messages</h1>
      </div>

      {messages.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No messages yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageThread
              key={msg.id}
              message={msg}
              clubId={clubId}
              onReply={replyToMessage}
              onMarkRead={markMessageRead}
              onRefresh={() => fetchClubMessages(clubId)}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageThread({
  message,
  clubId,
  onReply,
  onMarkRead,
  onRefresh,
  showToast,
}: {
  message: ClubMessage;
  clubId: string;
  onReply: (clubId: string, parentId: string, body: string) => Promise<void>;
  onMarkRead: (messageId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !message.read) {
      await onMarkRead(message.id).catch(() => {});
    }
    setExpanded(!expanded);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await onReply(clubId, message.id, replyText.trim());
      setReplyText('');
      await onRefresh();
      showToast('Reply sent!', 'success');
    } catch {
      showToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className={`p-4 ${!message.read ? 'bg-primary/[0.03] border-primary/20' : ''}`}>
      <button onClick={handleExpand} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm ${!message.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>
                {message.sender?.full_name || message.sender?.email || 'Unknown'}
              </p>
              {!message.read && (
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
              <span className="text-xs text-text-tertiary ml-auto flex-shrink-0">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm font-medium text-text-primary mt-0.5">{message.subject}</p>
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{message.body}</p>
          </div>
          <div className="flex-shrink-0 text-text-tertiary">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 ml-12 space-y-3">
          {/* Replies */}
          {message.replies && message.replies.length > 0 && (
            <div className="space-y-2">
              {message.replies.map((reply) => (
                <div key={reply.id} className="bg-background rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-text-primary">
                      {reply.sender?.full_name || 'Admin'}
                    </p>
                    <span className="text-xs text-text-tertiary">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{reply.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          <div className="flex gap-2">
            <textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <Button size="sm" onClick={handleReply} loading={sending} icon={<Send className="h-4 w-4" />}>
              Reply
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
