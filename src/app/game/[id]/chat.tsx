import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

interface ChatMessage {
  id: string;
  game_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function GameChatScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = session?.user.id;

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!gameId) return;
    const { data } = await supabase
      .from('game_messages')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  }, [gameId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_messages',
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          // Fetch the message with profile info
          const { data } = await supabase
            .from('game_messages')
            .select('*, profile:profiles(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const handleSend = async () => {
    if (!input.trim() || !gameId || !currentUserId || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const { error } = await supabase.from('game_messages').insert({
        game_id: gameId,
        user_id: currentUserId,
        content,
      });
      if (error) throw error;
    } catch {
      setInput(content); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.user_id === currentUserId;

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          item.profile?.avatar_url ? (
            <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.profile?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && (
            <Text style={styles.senderName}>{item.profile?.full_name || 'Unknown'}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isOwn && styles.timestampOwn]}>
            {format(new Date(item.created_at), 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Game Chat' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation with other players!</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            maxLength={1000}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: spacing.md, paddingBottom: spacing.sm },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  messageRowOwn: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...typography.caption1, color: colors.white, fontWeight: '600' },
  bubble: {
    maxWidth: '75%',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    ...typography.caption2,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  messageTextOwn: { color: colors.white },
  timestamp: {
    ...typography.caption2,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timestampOwn: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyText: { ...typography.headline, color: colors.textSecondary },
  emptySubtext: { ...typography.subheadline, color: colors.textTertiary },
});
