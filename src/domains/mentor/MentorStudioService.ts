import { Gig, Category } from '../../lib/supabase/types';
import { SEED_CATEGORIES, SEED_ADVISORS } from '../advisor/seedData';

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
  private static getStoredGigs(mentorId: string = 'evelyn-vasquez'): Gig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GIGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading mentor gigs', e);
    }
    const defaultGigs = SEED_ADVISORS[0].gigs;
    localStorage.setItem(STORAGE_KEY_GIGS, JSON.stringify(defaultGigs));
    return defaultGigs;
  }

  private static saveGigs(gigs: Gig[]) {
    try {
      localStorage.setItem(STORAGE_KEY_GIGS, JSON.stringify(gigs));
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

  /**
   * Get gig by ID
   */
  static async getGigById(gigId: string): Promise<Gig | null> {
    const gigs = this.getStoredGigs();
    return gigs.find((g) => g.id === gigId || g.slug === gigId) || null;
  }

  /**
   * Create or update a gig
   */
  static async saveGig(gigData: Partial<Gig> & { id?: string }): Promise<Gig> {
    const gigs = this.getStoredGigs();
    const isEdit = Boolean(gigData.id && gigs.some((g) => g.id === gigData.id));

    if (isEdit) {
      const index = gigs.findIndex((g) => g.id === gigData.id);
      const updated: Gig = {
        ...gigs[index],
        ...gigData,
      } as Gig;
      gigs[index] = updated;
      this.saveGigs(gigs);
      return updated;
    } else {
      const newGig: Gig = {
        id: gigData.id || `gig-${Date.now().toString().slice(-6)}`,
        mentor_id: gigData.mentor_id || 'evelyn-vasquez',
        category_id: gigData.category_id || 'mental-health',
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
      this.saveGigs(gigs);
      return newGig;
    }
  }

  /**
   * Delete gig
   */
  static async deleteGig(gigId: string): Promise<boolean> {
    const gigs = this.getStoredGigs();
    const filtered = gigs.filter((g) => g.id !== gigId);
    this.saveGigs(filtered);
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
