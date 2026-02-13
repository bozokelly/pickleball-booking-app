'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { GameMessage } from '@/types/database';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Send, User } from 'lucide-react';

export default function GameChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();
  const { session, profile } = useAuthStore();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('games').select('title').eq('id', gameId).single().then(({ data }) => {
      if (data) setGameTitle(data.title);
    });

    supabase
      .from('game_messages')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `game_id=eq.${gameId}` },
        async (payload) => {
          const { data } = await supabase
            .from('game_messages')
            .select('*, profile:profiles(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !session?.user) return;
    setSending(true);
    try {
      const { error } = await supabase.from('game_messages').insert({
        game_id: gameId,
        user_id: session.user.id,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-primary hover:underline">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Game Chat</h1>
          {gameTitle && <p className="text-sm text-text-secondary">{gameTitle}</p>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-center text-text-tertiary text-sm py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === session?.user.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {msg.profile?.avatar_url ? (
                    <img src={msg.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <p className={`text-xs mb-0.5 ${isMe ? 'text-right' : ''} text-text-tertiary`}>
                    {msg.profile?.full_name || 'Player'}
                  </p>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-surface border border-border text-text-primary rounded-bl-md'}`}>
                    {msg.content}
                  </div>
                  <p className={`text-xs text-text-tertiary mt-0.5 ${isMe ? 'text-right' : ''}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <Button
          onClick={handleSend}
          loading={sending}
          disabled={!newMessage.trim()}
          size="md"
          icon={<Send className="h-4 w-4" />}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
