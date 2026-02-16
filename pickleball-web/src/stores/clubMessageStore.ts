import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ClubMessage } from '@/types/database';

interface ClubMessageState {
  messages: ClubMessage[];
  loading: boolean;
  fetchClubMessages: (clubId: string) => Promise<void>;
  sendMessage: (clubId: string, subject: string, body: string) => Promise<void>;
  replyToMessage: (clubId: string, parentId: string, body: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
}

export const useClubMessageStore = create<ClubMessageState>((set) => ({
  messages: [], loading: false,

  fetchClubMessages: async (clubId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('club_messages')
        .select('*, sender:profiles!club_messages_sender_id_fkey(full_name, avatar_url, email)')
        .eq('club_id', clubId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg: ClubMessage) => {
          const { data: replies } = await supabase
            .from('club_messages')
            .select('*, sender:profiles!club_messages_sender_id_fkey(full_name, avatar_url, email)')
            .eq('parent_id', msg.id)
            .order('created_at', { ascending: true });
          return { ...msg, replies: replies || [] };
        })
      );

      set({ messages: messagesWithReplies });
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (clubId, subject, body) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('club_messages').insert({
      club_id: clubId, sender_id: user.id, subject, body,
    });
    if (error) throw new Error(error.message);

    await supabase.rpc('notify_club_admins', {
      p_club_id: clubId,
      p_title: 'New message from a member',
      p_body: subject,
      p_type: 'new_club_message',
      p_reference_id: clubId,
    });
  },

  replyToMessage: async (clubId, parentId, body) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: parent } = await supabase
      .from('club_messages')
      .select('sender_id, subject')
      .eq('id', parentId)
      .single();

    const { error } = await supabase.from('club_messages').insert({
      club_id: clubId, sender_id: user.id, parent_id: parentId,
      subject: `Re: ${parent?.subject || ''}`, body,
    });
    if (error) throw new Error(error.message);

    if (parent) {
      await supabase.from('notifications').insert({
        user_id: parent.sender_id,
        title: 'Reply to your message',
        body: `An admin replied to "${parent.subject}"`,
        type: 'club_message_reply',
        reference_id: clubId,
      });
    }
  },

  markMessageRead: async (messageId) => {
    await supabase.from('club_messages').update({ read: true }).eq('id', messageId);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, read: true } : m
      ),
    }));
  },
}));
