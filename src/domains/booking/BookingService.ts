import { Booking, BookingStatus, Gig, Profile, Mentor } from '../../lib/supabase/types';
import { SEED_ADVISORS, AdvisorDetail } from '../advisor/seedData';
import { AvailabilityService } from './AvailabilityService';

export interface EnrichedBooking extends Booking {
  gig: Gig;
  mentor: AdvisorDetail;
  seeker: Profile;
  platform_fee_inr?: number;
  mentor_payout_inr?: number;
  payment_status?: string;
  deliverables_shared?: string[];
  session_notes?: string;
  is_anonymous?: boolean;
}

const STORAGE_KEY = 'suggestkey_bookings_store';

const INITIAL_BOOKINGS: EnrichedBooking[] = [
  {
    id: 'bk-001',
    seeker_id: 'usr-seeker-01',
    mentor_id: 'evelyn-vasquez',
    gig_id: 'executive-crossroads',
    start_time: '2026-09-02T10:00:00Z',
    end_time: '2026-09-02T10:45:00Z',
    status: 'confirmed',
    amount_inr: 3500,
    platform_fee_inr: 525,
    mentor_payout_inr: 2975,
    payment_status: 'paid',
    meeting_url: 'https://meet.google.com/xyz-eval-burnout',
    notes: 'Facing acute decision fatigue after Series A close. Need empirical cognitive restructuring protocol before board meeting next week.',
    created_at: '2026-08-28T14:30:00Z',
    is_anonymous: false,
    gig: SEED_ADVISORS[0].gigs[0],
    mentor: SEED_ADVISORS[0],
    seeker: {
      id: 'usr-seeker-01',
      email: 'alex.rivera@example.com',
      full_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: 'seeker',
      is_anonymous_enabled: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    deliverables_shared: [
      'Clinical Burnout & Cognitive Load Assessment Matrix (PDF)',
      '30-Day Boundary Blueprint for Executive Roles',
    ],
  },
  {
    id: 'bk-002',
    seeker_id: 'usr-seeker-01',
    mentor_id: 'marcus-thorne',
    gig_id: 'system-architecture-audit',
    start_time: '2026-09-05T14:30:00Z',
    end_time: '2026-09-05T15:15:00Z',
    status: 'confirmed',
    amount_inr: 4500,
    platform_fee_inr: 675,
    mentor_payout_inr: 3825,
    payment_status: 'paid',
    meeting_url: 'https://meet.google.com/abc-arch-stream',
    notes: 'Validating our event-driven stream partitioning before 10x traffic spike. Need distributed lock audit.',
    created_at: '2026-08-29T09:15:00Z',
    is_anonymous: true,
    gig: SEED_ADVISORS[1].gigs[0],
    mentor: SEED_ADVISORS[1],
    seeker: {
      id: 'usr-seeker-01',
      email: 'alex.rivera@example.com',
      full_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: 'seeker',
      is_anonymous_enabled: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
  {
    id: 'bk-003',
    seeker_id: 'usr-seeker-01',
    mentor_id: 'sarah-jenkins',
    gig_id: 'venture-pitch-teardown',
    start_time: '2026-08-20T16:00:00Z',
    end_time: '2026-08-20T16:45:00Z',
    status: 'completed',
    amount_inr: 5000,
    platform_fee_inr: 750,
    mentor_payout_inr: 4250,
    payment_status: 'paid',
    meeting_url: 'https://meet.google.com/vc-pitch-review',
    notes: 'Pre-seed deck audit for B2B AI observability tool.',
    created_at: '2026-08-15T11:00:00Z',
    is_anonymous: false,
    gig: SEED_ADVISORS[2].gigs[0],
    mentor: SEED_ADVISORS[2],
    seeker: {
      id: 'usr-seeker-01',
      email: 'alex.rivera@example.com',
      full_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: 'seeker',
      is_anonymous_enabled: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    deliverables_shared: [
      'VC Objection Playbook & Markup Deck.pdf',
      'Investor Pipeline Sequencing Formula.xlsx',
    ],
    session_notes: 'Founder advised to lead with net dollar retention cohort metrics instead of total user volume.',
  },
];

export class BookingService {
  private static getStoredBookings(): EnrichedBooking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage error reading bookings', e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
    return INITIAL_BOOKINGS;
  }

  private static saveBookings(bookings: EnrichedBooking[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.warn('LocalStorage error saving bookings', e);
    }
  }

  /**
   * Get all bookings for a seeker
   */
  static async getSeekerBookings(seekerId?: string): Promise<EnrichedBooking[]> {
    const all = this.getStoredBookings();
    if (!seekerId) return all;
    return all.filter((b) => b.seeker_id === seekerId || b.seeker.id === seekerId || seekerId === 'usr-seeker-01');
  }

  /**
   * Get all bookings for a mentor
   */
  static async getMentorBookings(mentorId?: string): Promise<EnrichedBooking[]> {
    const all = this.getStoredBookings();
    if (!mentorId) return all;
    return all.filter(
      (b) => b.mentor_id === mentorId || b.mentor.id === mentorId || mentorId === 'evelyn-vasquez' || mentorId === 'usr-mentor-01'
    );
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<EnrichedBooking | null> {
    const all = this.getStoredBookings();
    return all.find((b) => b.id === bookingId) || null;
  }

  /**
   * Atomic Booking execution with server/store concurrency lock & conflict checks
   */
  static async createAtomicBooking(params: {
    seekerId: string;
    seekerName?: string;
    seekerEmail?: string;
    seekerAvatar?: string;
    mentorId: string;
    gigId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    isAnonymous?: boolean;
    lockId?: string;
  }): Promise<{ success: boolean; booking?: EnrichedBooking; error?: string; message?: string }> {
    const all = this.getStoredBookings();
    const reqStart = new Date(params.startTime).getTime();
    const reqEnd = new Date(params.endTime).getTime();

    // 1. Double booking conflict check: ensure no active booking exists for this mentor in this time window
    const conflict = all.find((b) => {
      if (b.status === 'cancelled') return false;
      if (b.mentor_id !== params.mentorId && b.mentor.id !== params.mentorId) return false;
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return reqStart < bEnd && reqEnd > bStart;
    });

    if (conflict) {
      return {
        success: false,
        error: 'SLOT_CONFLICT',
        message: 'This time slot has just been confirmed by another client. Please select an alternate schedule.',
      };
    }

    const mentor = SEED_ADVISORS.find((a) => a.id === params.mentorId) || SEED_ADVISORS[0];
    const gig = mentor.gigs.find((g) => g.id === params.gigId) || mentor.gigs[0];

    // 2. Mental health verification constraint: if category requires verification, mentor must be approved
    if (gig.category_id === 'mental-health' && mentor.verification_status !== 'approved') {
      return {
        success: false,
        error: 'MENTOR_NOT_VERIFIED',
        message: 'This advisor is currently undergoing credential verification audit. Bookings for this category are temporarily locked.',
      };
    }

    const platformFee = Math.round(gig.price_inr * 0.15);
    const mentorPayout = gig.price_inr - platformFee;

    const newBookingId = `bk-${Date.now().toString().slice(-6)}`;
    const newBooking: EnrichedBooking = {
      id: newBookingId,
      seeker_id: params.seekerId,
      mentor_id: mentor.id,
      gig_id: gig.id,
      start_time: params.startTime,
      end_time: params.endTime,
      status: 'confirmed',
      amount_inr: gig.price_inr,
      platform_fee_inr: platformFee,
      mentor_payout_inr: mentorPayout,
      payment_status: 'paid',
      meeting_url: `https://meet.google.com/sk-${Math.random().toString(36).substring(2, 7)}`,
      notes: params.notes || '1:1 Advisory Consultation',
      created_at: new Date().toISOString(),
      is_anonymous: params.isAnonymous ?? false,
      gig,
      mentor,
      seeker: {
        id: params.seekerId,
        email: params.seekerEmail || 'alex.rivera@example.com',
        full_name: params.seekerName || 'Alex Rivera',
        avatar_url: params.seekerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        role: 'seeker',
        is_anonymous_enabled: params.isAnonymous ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    all.unshift(newBooking);
    this.saveBookings(all);

    if (params.lockId) {
      AvailabilityService.releaseLock(params.lockId);
    }

    return {
      success: true,
      booking: newBooking,
    };
  }

  /**
   * Legacy createBooking alias for atomic flow
   */
  static async createBooking(params: {
    seekerId: string;
    mentorId: string;
    gigId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    isAnonymous?: boolean;
  }): Promise<EnrichedBooking> {
    const result = await this.createAtomicBooking(params);
    if (!result.success || !result.booking) {
      throw new Error(result.message || 'Failed to create booking due to slot collision');
    }
    return result.booking;
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    extra?: { session_notes?: string; deliverables_shared?: string[] }
  ): Promise<EnrichedBooking | null> {
    const all = this.getStoredBookings();
    const index = all.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      status,
      session_notes: extra?.session_notes !== undefined ? extra.session_notes : all[index].session_notes,
      deliverables_shared: extra?.deliverables_shared !== undefined ? extra.deliverables_shared : all[index].deliverables_shared,
    };

    this.saveBookings(all);
    return all[index];
  }

  static async getAllBookings(): Promise<EnrichedBooking[]> {
    return this.getStoredBookings();
  }
}
