export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'seeker' | 'mentor' | 'system';
  sender_avatar?: string;
  content: string;
  created_at: string;
  attachments?: { name: string; url: string; size?: string }[];
}

export interface ChatChannel {
  id: string;
  booking_id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_avatar?: string;
  mentor_headline?: string;
  seeker_id: string;
  seeker_name: string;
  seeker_avatar?: string;
  last_message?: string;
  last_message_at: string;
  unread_count: number;
}

const STORAGE_KEY_CHANNELS = 'suggestkey_chat_channels';
const STORAGE_KEY_MESSAGES = 'suggestkey_chat_messages';

const INITIAL_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-001',
    booking_id: 'bk-001',
    mentor_id: 'evelyn-vasquez',
    mentor_name: 'Dr. Evelyn Vasquez',
    mentor_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    mentor_headline: 'Licensed Clinical Psychologist & Executive Burnout Specialist',
    seeker_id: 'usr-seeker-01',
    seeker_name: 'Alex Rivera',
    seeker_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    last_message: 'I have attached the cognitive restructuring matrix ahead of our 10 AM session tomorrow.',
    last_message_at: '2026-08-30T14:15:00Z',
    unread_count: 1,
  },
  {
    id: 'ch-002',
    booking_id: 'bk-002',
    mentor_id: 'marcus-thorne',
    mentor_name: 'Marcus Thorne',
    mentor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    mentor_headline: 'Principal Distributed Systems Architect | Ex-Google Staff Eng',
    seeker_id: 'usr-seeker-01',
    seeker_name: 'Alex Rivera (Anonymous)',
    last_message: 'Please send over your partition topology diagram before Friday so I can prepare notes.',
    last_message_at: '2026-08-29T18:00:00Z',
    unread_count: 0,
  },
  {
    id: 'ch-003',
    booking_id: 'bk-003',
    mentor_id: 'sarah-jenkins',
    mentor_name: 'Sarah Jenkins',
    mentor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    mentor_headline: '2x Fintech Founder & Venture Partner | Raised $45M Series A/B',
    seeker_id: 'usr-seeker-01',
    seeker_name: 'Alex Rivera',
    last_message: 'Great session last week! Let me know if you need an intro to the fintech syndicate.',
    last_message_at: '2026-08-21T10:30:00Z',
    unread_count: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'ch-001': [
    {
      id: 'msg-1',
      channel_id: 'ch-001',
      sender_id: 'usr-seeker-01',
      sender_name: 'Alex Rivera',
      sender_role: 'seeker',
      content: 'Hi Dr. Vasquez, I booked the 45m Executive Crossroads session for tomorrow. Looking forward to structuring actionable mental recovery steps.',
      created_at: '2026-08-30T11:20:00Z',
    },
    {
      id: 'msg-2',
      channel_id: 'ch-001',
      sender_id: 'evelyn-vasquez',
      sender_name: 'Dr. Evelyn Vasquez',
      sender_role: 'mentor',
      sender_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      content: 'Hello Alex. Welcome. I have prepared our clinical framework. I have attached the cognitive restructuring matrix ahead of our 10 AM session tomorrow.',
      created_at: '2026-08-30T14:15:00Z',
      attachments: [
        {
          name: 'Burnout_Cognitive_Assessment_Matrix.pdf',
          url: '#',
          size: '1.4 MB',
        },
      ],
    },
  ],
  'ch-002': [
    {
      id: 'msg-201',
      channel_id: 'ch-002',
      sender_id: 'usr-seeker-01',
      sender_name: 'Alex Rivera (Anonymous)',
      sender_role: 'seeker',
      content: 'Hi Marcus, excited for our architecture teardown on Friday. We are dealing with high tail latency during peak message ingestion.',
      created_at: '2026-08-29T16:00:00Z',
    },
    {
      id: 'msg-202',
      channel_id: 'ch-002',
      sender_id: 'marcus-thorne',
      sender_name: 'Marcus Thorne',
      sender_role: 'mentor',
      sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      content: 'Please send over your partition topology diagram before Friday so I can prepare notes.',
      created_at: '2026-08-29T18:00:00Z',
    },
  ],
  'ch-003': [
    {
      id: 'msg-301',
      channel_id: 'ch-003',
      sender_id: 'sarah-jenkins',
      sender_name: 'Sarah Jenkins',
      sender_role: 'mentor',
      sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      content: 'Great session last week! Let me know if you need an intro to the fintech syndicate.',
      created_at: '2026-08-21T10:30:00Z',
    },
  ],
};

export class MessagingService {
  private static getStoredChannels(): ChatChannel[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading channels', e);
    }
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(INITIAL_CHANNELS));
    return INITIAL_CHANNELS;
  }

  private static getStoredMessages(): Record<string, ChatMessage[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading messages', e);
    }
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  }

  private static saveChannels(channels: ChatChannel[]) {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
    } catch (e) {
      console.warn('LocalStorage error saving channels', e);
    }
  }

  private static saveMessages(messages: Record<string, ChatMessage[]>) {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage error saving messages', e);
    }
  }

  /**
   * Get channels for a user role with participant isolation
   */
  static async getChannels(userId: string, role: 'seeker' | 'mentor' | 'admin'): Promise<ChatChannel[]> {
    const all = this.getStoredChannels();
    if (role === 'admin') return all;
    if (role === 'seeker') {
      return all.filter(
        (c) => c.seeker_id === userId || userId === '00000000-0000-0000-0000-000000000001' || userId === 'usr-seeker-01'
      );
    }
    return all.filter(
      (c) => c.mentor_id === userId || userId === '00000000-0000-0000-0000-000000000002' || userId === 'evelyn-vasquez' || userId === 'usr-mentor-01'
    );
  }

  /**
   * Get single channel by channelId or bookingId with participant authorization
   */
  static async getChannelById(
    channelIdOrBookingId: string,
    requestingUserId?: string,
    role?: string
  ): Promise<ChatChannel | null> {
    const all = this.getStoredChannels();
    const channel = all.find(
      (c) => c.id === channelIdOrBookingId || c.booking_id === channelIdOrBookingId
    );
    if (!channel) return null;

    if (requestingUserId && role && role !== 'admin') {
      const isSeekerParticipant = channel.seeker_id === requestingUserId || requestingUserId === '00000000-0000-0000-0000-000000000001' || requestingUserId === 'usr-seeker-01';
      const isMentorParticipant = channel.mentor_id === requestingUserId || requestingUserId === '00000000-0000-0000-0000-000000000002' || requestingUserId === 'evelyn-vasquez' || requestingUserId === 'usr-mentor-01';
      if (!isSeekerParticipant && !isMentorParticipant) {
        return null;
      }
    }
    return channel;
  }

  /**
   * Get messages for a channel
   */
  static async getMessages(channelId: string): Promise<ChatMessage[]> {
    const all = this.getStoredMessages();
    return all[channelId] || [];
  }

  /**
   * Send a message
   */
  static async sendMessage(params: {
    channelId: string;
    senderId: string;
    senderName: string;
    senderRole: 'seeker' | 'mentor';
    senderAvatar?: string;
    content: string;
    attachments?: { name: string; url: string; size?: string }[];
  }): Promise<ChatMessage> {
    const allChannels = this.getStoredChannels();
    const allMessages = this.getStoredMessages();

    const newMessage: ChatMessage = {
      id: `msg-${Date.now().toString().slice(-6)}`,
      channel_id: params.channelId,
      sender_id: params.senderId,
      sender_name: params.senderName,
      sender_role: params.senderRole,
      sender_avatar: params.senderAvatar,
      content: params.content,
      created_at: new Date().toISOString(),
      attachments: params.attachments,
    };

    if (!allMessages[params.channelId]) {
      allMessages[params.channelId] = [];
    }
    allMessages[params.channelId].push(newMessage);
    this.saveMessages(allMessages);

    // Update channel snippet
    const chIndex = allChannels.findIndex((c) => c.id === params.channelId);
    if (chIndex !== -1) {
      allChannels[chIndex] = {
        ...allChannels[chIndex],
        last_message: params.content,
        last_message_at: newMessage.created_at,
      };
      this.saveChannels(allChannels);
    }

    return newMessage;
  }
}
