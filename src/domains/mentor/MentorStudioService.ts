import { Gig } from '../../lib/supabase/types';
import { SegmentService } from '../segment/SegmentService';
import { INITIAL_SEED_SEGMENTS } from '../segment/SegmentTypes';
import { SEED_ADVISORS } from '../advisor/seedData';

export interface AvailabilitySlotRule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number; // 45
  bufferMinutes: number; // 15
}

export interface MentorEarningsStats {
  totalGrossInr: number;
  platformFeeInr: number;
  netPayoutInr: number;
  pendingEscrowInr: number;
  completedSessionsCount: number;
  upcomingSessionsCount: number;
  payoutHistory: {
    id: string;
    date: string;
    amountInr: number;
    status: 'transferred' | 'processing' | 'pending';
    bankAccountEnding: string;
    utrNumber: string;
  }[];
}

const STORAGE_KEY_GIGS = 'suggestkey_mentor_gigs';
const STORAGE_KEY_AVAILABILITY = 'suggestkey_mentor_availability';

const DEFAULT_AVAILABILITY: AvailabilitySlotRule[] = [
  { dayOfWeek: 'Monday', enabled: true, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Tuesday', enabled: true, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Wednesday', enabled: true, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Thursday', enabled: true, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Friday', enabled: true, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Saturday', enabled: false, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 45, bufferMinutes: 15 },
  { dayOfWeek: 'Sunday', enabled: false, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 45, bufferMinutes: 15 },
];

export class MentorStudioService {
  private static getGigsStorageKey(mentorId: string): string {
    return `${STORAGE_KEY_GIGS}_${mentorId}`;
  }

  private static getStoredGigs(mentorId: string = 'evelyn-vasquez'): Gig[] {
    const key = this.getGigsStorageKey(mentorId);
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading mentor gigs', e);
    }
    const mentorSeed = SEED_ADVISORS.find((a) => a.id === mentorId);
    const defaultGigs = (mentorSeed?.gigs || SEED_ADVISORS[0].gigs).map((g) => ({
      ...g,
      segment_id: g.segment_id || g.category_id || g.id,
    }));
    localStorage.setItem(key, JSON.stringify(defaultGigs));
    return defaultGigs;
  }

  private static saveGigs(mentorId: string, gigs: Gig[]) {
    const key = this.getGigsStorageKey(mentorId);
    try {
      localStorage.setItem(key, JSON.stringify(gigs));
    } catch (e) {
      console.warn('LocalStorage error saving mentor gigs', e);
    }
  }

  /**
   * Get all gigs for active mentor
   */
  static async getMentorGigs(mentorId: string = 'evelyn-vasquez'): Promise<Gig[]> {
    return this.getStoredGigs(mentorId);
  }

  static async getGigById(gigId: string, mentorId: string = 'evelyn-vasquez'): Promise<Gig | null> {
    const gigs = this.getStoredGigs(mentorId);
    return gigs.find((g) => g.id === gigId || g.slug === gigId) || null;
  }

  static async saveGig(
    gigData: Partial<Gig> & { id?: string; segment_id?: string },
    mentorId: string = 'evelyn-vasquez'
  ): Promise<Gig> {
    const gigs = this.getStoredGigs(mentorId);
    const activeSegments = await SegmentService.getActiveSegments();
    const activeSegmentIds = new Set(activeSegments.map((s) => s.id));
    const activeSegmentSlugs = new Set(activeSegments.map((s) => s.slug));

    const segmentId = gigData.segment_id;
    const segmentActive =
      segmentId && (activeSegmentIds.has(segmentId) || activeSegmentSlugs.has(segmentId));

    if (segmentId && !segmentActive) {
      const err = new Error(
        'Cannot save gig: selected segment is not active. Mentors can only create gigs under active admin-managed segments.'
      );
      (err as any).code = 'ACTIVE_SEGMENT_REQUIRED';
      throw err;
    }

    const isEdit = Boolean(gigData.id && gigs.some((g) => g.id === gigData.id));
    const fallbackSegmentId =
      activeSegments[0]?.id || INITIAL_SEED_SEGMENTS[0]?.id || activeSegments[0]?.slug || INITIAL_SEED_SEGMENTS[0]?.slug;

    if (isEdit) {
      const index = gigs.findIndex((g) => g.id === gigData.id);
      if (index === -1) {
        const err = new Error('Cannot update gig: you do not have permission to modify this gig.');
        (err as any).code = 'PERMISSION_DENIED';
        throw err;
      }
      const updated: Gig = {
        ...gigs[index],
        ...gigData,
        segment_id: gigData.segment_id || gigs[index].segment_id,
        mentor_id: mentorId,
      } as Gig;
      gigs[index] = updated;
      this.saveGigs(mentorId, gigs);
      return updated;
    } else {
      const newGig: Gig = {
        id: gigData.id || `gig-${Date.now().toString().slice(-6)}`,
        mentor_id: mentorId,
        segment_id: gigData.segment_id || fallbackSegmentId,
        title: gigData.title || 'Untitled Advisory Session',
        slug: (gigData.title || 'untitled-session').toLowerCase().replace(/\s+/g, '-'),
        description: gigData.description || 'Comprehensive 1:1 advisory consultation.',
        duration_minutes: gigData.duration_minutes || 45,
        price_inr: gigData.price_inr || 3500,
        deliverables: gigData.deliverables || ['45-minute 1:1 consultation', 'Written post-call summary'],
        is_published: gigData.is_published ?? true,
        created_at: new Date().toISOString(),
      };
      gigs.unshift(newGig);
      this.saveGigs(mentorId, gigs);
      return newGig;
    }
  }

  static async deleteGig(gigId: string, mentorId: string = 'evelyn-vasquez'): Promise<boolean> {
    const gigs = this.getStoredGigs(mentorId);
    const gig = gigs.find((g) => g.id === gigId || g.slug === gigId);
    if (!gig) {
      const err = new Error('Cannot delete gig: you do not have permission to delete this gig.');
      (err as any).code = 'PERMISSION_DENIED';
      throw err;
    }
    const filtered = gigs.filter((g) => g.id !== gigId);
    this.saveGigs(mentorId, filtered);
    return true;
  }

  /**
   * Get availability schedule
   */
  static async getAvailability(mentorId: string = 'evelyn-vasquez'): Promise<AvailabilitySlotRule[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AVAILABILITY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading availability', e);
    }
    localStorage.setItem(STORAGE_KEY_AVAILABILITY, JSON.stringify(DEFAULT_AVAILABILITY));
    return DEFAULT_AVAILABILITY;
  }

  /**
   * Save availability schedule
   */
  static async saveAvailability(rules: AvailabilitySlotRule[]): Promise<AvailabilitySlotRule[]> {
    try {
      localStorage.setItem(STORAGE_KEY_AVAILABILITY, JSON.stringify(rules));
    } catch (e) {
      console.warn('LocalStorage error saving availability', e);
    }
    return rules;
  }

  /**
   * Get earnings summary
   */
  static async getEarningsStats(mentorId: string = 'evelyn-vasquez'): Promise<MentorEarningsStats> {
    return {
      totalGrossInr: 42000,
      platformFeeInr: 6300,
      netPayoutInr: 35700,
      pendingEscrowInr: 7000,
      completedSessionsCount: 12,
      upcomingSessionsCount: 2,
      payoutHistory: [
        {
          id: 'po-101',
          date: '2026-08-25',
          amountInr: 18500,
          status: 'transferred',
          bankAccountEnding: '••• 4912',
          utrNumber: 'UTR-HDFC-992019482',
        },
        {
          id: 'po-102',
          date: '2026-08-10',
          amountInr: 17200,
          status: 'transferred',
          bankAccountEnding: '••• 4912',
          utrNumber: 'UTR-HDFC-883921004',
        },
      ],
    };
  }
}
