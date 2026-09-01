import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: 'seeker' | 'mentor' | 'system';
  sender_avatar?: string;
  content: string;
  attachments?: { name: string; url: string; size?: string }[];
  created_at: string;
}

export interface ChatChannel {
  id: string;
  booking_id?: string;
  mentor_id: string;
  mentor_name?: string;
  mentor_avatar?: string;
  mentor_headline?: string;
  seeker_id: string;
  seeker_name?: string;
  seeker_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export class MessagingService {
  /**
   * Get conversations for a user with participant isolation
   */
  static async getChannels(userId: string, role: 'seeker' | 'mentor' | 'admin'): Promise<ChatChannel[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty channels.');
      return [];
    }

    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          booking_id,
          seeker_id,
          mentor_id,
          last_message_at,
          created_at,
          seeker:profiles!conversations_seeker_id_fkey(id, full_name, avatar_url),
          mentor:mentors!conversations_mentor_id_fkey(
            id,
            headline,
            profile:profiles!mentors_id_fkey(id, full_name, avatar_url)
          ),
          messages:messages(id, content, created_at, sender_id)
        `)
        .order('last_message_at', { ascending: false, nullsLast: true });

      if (role === 'seeker') {
        query = query.eq('seeker_id', userId);
      } else if (role === 'mentor') {
        query = query.eq('mentor_id', userId);
      }
      // Admin sees all conversations

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching channels:', error);
        return [];
      }

      return (data || []).map((conv: any) => {
        const lastMessage = conv.messages?.length > 0
          ? conv.messages[conv.messages.length - 1]
          : null;

        const mentorProfile = conv.mentor?.profile || {};
        const seekerProfile = conv.seeker || {};

        return {
          id: conv.id,
          booking_id: conv.booking_id,
          mentor_id: conv.mentor_id,
          mentor_name: mentorProfile.full_name || 'Advisor',
          mentor_avatar: mentorProfile.avatar_url,
          mentor_headline: conv.mentor?.headline,
          seeker_id: conv.seeker_id,
          seeker_name: seekerProfile.full_name || 'Seeker',
          seeker_avatar: seekerProfile.avatar_url,
          last_message: lastMessage?.content,
          last_message_at: lastMessage?.created_at || conv.last_message_at,
          unread_count: 0, // TODO: Implement unread count tracking
          created_at: conv.created_at,
        };
      });
    } catch (err) {
      console.error('Error in getChannels:', err);
      return [];
    }
  }

  /**
   * Get single conversation by ID with participant authorization
   */
  static async getChannelById(
    conversationIdOrBookingId: string,
    requestingUserId?: string,
    role?: string
  ): Promise<ChatChannel | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch channel.');
      return null;
    }

    try {
      // Try to find by conversation ID first, then by booking ID
      let query = supabase
        .from('conversations')
        .select(`
          id,
          booking_id,
          seeker_id,
          mentor_id,
          last_message_at,
          created_at,
          seeker:profiles!conversations_seeker_id_fkey(id, full_name, avatar_url),
          mentor:mentors!conversations_mentor_id_fkey(
            id,
            headline,
            profile:profiles!mentors_id_fkey(id, full_name, avatar_url)
          ),
          messages:messages(id, content, created_at, sender_id)
        `)
        .or(`id.eq.${conversationIdOrBookingId},booking_id.eq.${conversationIdOrBookingId}`)
        .single();

      const { data, error } = await query;

      if (error || !data) {
        console.error('Error fetching channel:', error);
        return null;
      }

      // Check participant authorization
      if (requestingUserId && role && role !== 'admin') {
        const isParticipant = data.seeker_id === requestingUserId || data.mentor_id === requestingUserId;
        if (!isParticipant) {
          return null;
        }
      }

      const lastMessage = data.messages?.length > 0
        ? data.messages[data.messages.length - 1]
        : null;

      const mentorProfile = data.mentor?.profile || {};
      const seekerProfile = data.seeker || {};

      return {
        id: data.id,
        booking_id: data.booking_id,
        mentor_id: data.mentor_id,
        mentor_name: mentorProfile.full_name || 'Advisor',
        mentor_avatar: mentorProfile.avatar_url,
        mentor_headline: data.mentor?.headline,
        seeker_id: data.seeker_id,
        seeker_name: seekerProfile.full_name || 'Seeker',
        seeker_avatar: seekerProfile.avatar_url,
        last_message: lastMessage?.content,
        last_message_at: lastMessage?.created_at || data.last_message_at,
        unread_count: 0,
        created_at: data.created_at,
      };
    } catch (err) {
      console.error('Error in getChannelById:', err);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty messages.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          attachments,
          created_at,
          sender:profiles(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.full_name,
        sender_avatar: msg.sender?.avatar_url,
        content: msg.content,
        attachments: msg.attachments || [],
        created_at: msg.created_at,
      }));
    } catch (err) {
      console.error('Error in getMessages:', err);
      return [];
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName?: string;
    senderRole?: 'seeker' | 'mentor';
    senderAvatar?: string;
    content: string;
    attachments?: { name: string; url: string; size?: string }[];
  }): Promise<ChatMessage | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot send message.');
      return null;
    }

    try {
      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          sender_id: params.senderId,
          content: params.content,
          attachments: params.attachments ? JSON.stringify(params.attachments) : '[]',
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          attachments,
          created_at,
          sender:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (messageError || !messageData) {
        console.error('Error sending message:', messageError);
        return null;
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: messageData.created_at })
        .eq('id', params.conversationId);

      return {
        id: messageData.id,
        conversation_id: messageData.conversation_id,
        sender_id: messageData.sender_id,
        sender_name: messageData.sender?.full_name,
        sender_avatar: messageData.sender?.avatar_url,
        content: messageData.content,
        attachments: messageData.attachments || [],
        created_at: messageData.created_at,
      };
    } catch (err) {
      console.error('Error in sendMessage:', err);
      return null;
    }
  }

  /**
   * Subscribe to real-time messages for a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void
  ) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot subscribe to messages.');
      return () => {};
    }

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as any;
          callback({
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            content: msg.content,
            attachments: msg.attachments || [],
            created_at: msg.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) {
      return 0;
    }

    try {
      // Get all conversations for this user
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`);

      if (convError || !conversations) {
        return 0;
      }

      const conversationIds = conversations.map(c => c.id);

      // Count messages not sent by this user
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error in getUnreadCount:', err);
      return 0;
    }
  }
}
