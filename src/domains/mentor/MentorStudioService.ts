import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Gig } from '../../lib/supabase/types';
import { SegmentService } from '../segment/SegmentService';

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

// Default availability template (UI configuration, not business data)
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
  /**
   * Get all gigs for a mentor from Supabase
   */
  static async getMentorGigs(mentorId: string): Promise<Gig[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty gigs.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentor gigs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getMentorGigs:', err);
      return [];
    }
  }

  static async getGigById(gigId: string, mentorId?: string): Promise<Gig | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch gig.');
      return null;
    }

    try {
      let query = supabase
        .from('gigs')
        .select('*')
        .or(`id.eq.${gigId},slug.eq.${gigId}`);

      if (mentorId) {
        query = query.eq('mentor_id', mentorId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Error fetching gig:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getGigById:', err);
      return null;
    }
  }

  static async saveGig(
    gigData: Partial<Gig> & { id?: string; segment_id: string },
    mentorId: string
  ): Promise<Gig> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot save gig.');
    }

    if (!mentorId) {
      throw new Error('Mentor ID is required to save a gig.');
    }

    if (!gigData.title || !gigData.title.trim()) {
      throw new Error('Gig title is required.');
    }

    if (!gigData.segment_id) {
      throw new Error('A valid active segment is required to create a gig.');
    }

    // Validate segment is active
    const segment = await SegmentService.getSegmentBySlug(gigData.segment_id);
    if (!segment) {
      const err = new Error('Selected segment does not exist.');
      (err as any).code = 'SEGMENT_NOT_FOUND';
      throw err;
    }
    if (!segment.is_active) {
      const err = new Error(
        'Cannot save gig: selected segment is not active. Mentors can only create gigs under active admin-managed segments.'
      );
      (err as any).code = 'ACTIVE_SEGMENT_REQUIRED';
      throw err;
    }

    const isEdit = Boolean(gigData.id);

    if (isEdit) {
      // Update existing gig — ownership enforced by .eq('mentor_id', mentorId)
      const { data, error } = await supabase
        .from('gigs')
        .update({
          title: gigData.title.trim(),
          description: gigData.description?.trim() || '',
          duration_minutes: gigData.duration_minutes,
          price_inr: gigData.price_inr,
          deliverables: gigData.deliverables,
          is_published: gigData.is_published,
          segment_id: gigData.segment_id,
        })
        .eq('id', gigData.id)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Cannot update gig: you do not have permission to modify this gig.');
      }

      return data;
    } else {
      // Create new gig — segment_id must reference an active segment
      const slug = gigData.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('gigs')
        .insert({
          mentor_id: mentorId,
          segment_id: gigData.segment_id,
          title: gigData.title.trim(),
          slug: slug || `gig-${Date.now()}`,
          description: gigData.description?.trim() || '',
          duration_minutes: gigData.duration_minutes,
          price_inr: gigData.price_inr,
          deliverables: gigData.deliverables || [],
          is_published: gigData.is_published ?? true,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create gig.');
      }

      return data;
    }
  }

  static async deleteGig(gigId: string, mentorId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot delete gig.');
    }

    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', gigId)
      .eq('mentor_id', mentorId);

    if (error) {
      throw new Error(error.message || 'Cannot delete gig: you do not have permission to delete this gig.');
    }

    return true;
  }

  /**
   * Get availability schedule (stored in localStorage as UI preference)
   */
  static async getAvailability(mentorId: string = 'current'): Promise<AvailabilitySlotRule[]> {
    const STORAGE_KEY_AVAILABILITY = 'suggestkey_mentor_availability';
    try {
      const data = localStorage.getItem(STORAGE_KEY_AVAILABILITY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalStorage error reading availability', e);
    }
    return DEFAULT_AVAILABILITY;
  }

  /**
   * Save availability schedule (stored in localStorage as UI preference)
   */
  static async saveAvailability(rules: AvailabilitySlotRule[]): Promise<AvailabilitySlotRule[]> {
    const STORAGE_KEY_AVAILABILITY = 'suggestkey_mentor_availability';
    try {
      localStorage.setItem(STORAGE_KEY_AVAILABILITY, JSON.stringify(rules));
    } catch (e) {
      console.warn('LocalStorage error saving availability', e);
    }
    return rules;
  }

  /**
   * Get earnings summary from Supabase
   */
  static async getEarningsStats(mentorId: string): Promise<MentorEarningsStats> {
    if (!isSupabaseConfigured) {
      return {
        totalGrossInr: 0,
        platformFeeInr: 0,
        netPayoutInr: 0,
        pendingEscrowInr: 0,
        completedSessionsCount: 0,
        upcomingSessionsCount: 0,
        payoutHistory: [],
      };
    }

    try {
      // Get completed bookings
      const { data: completedBookings, error: completedError } = await supabase
        .from('bookings')
        .select('amount_inr, platform_fee_inr, mentor_payout_inr')
        .eq('mentor_id', mentorId)
        .eq('status', 'completed');

      // Get upcoming bookings
      const { data: upcomingBookings, error: upcomingError } = await supabase
        .from('bookings')
        .select('amount_inr')
        .eq('mentor_id', mentorId)
        .in('status', ['confirmed', 'in_progress']);

      if (completedError || upcomingError) {
        console.error('Error fetching earnings:', completedError || upcomingError);
      }

      const completed = completedBookings || [];
      const upcoming = upcomingBookings || [];

      const totalGrossInr = completed.reduce((sum, b) => sum + (b.amount_inr || 0), 0);
      const platformFeeInr = completed.reduce((sum, b) => sum + (b.platform_fee_inr || 0), 0);
      const netPayoutInr = completed.reduce((sum, b) => sum + (b.mentor_payout_inr || 0), 0);
      const pendingEscrowInr = upcoming.reduce((sum, b) => sum + (b.amount_inr || 0), 0);

      return {
        totalGrossInr,
        platformFeeInr,
        netPayoutInr,
        pendingEscrowInr,
        completedSessionsCount: completed.length,
        upcomingSessionsCount: upcoming.length,
        payoutHistory: [], // Would be populated from a payouts table in a full implementation
      };
    } catch (err) {
      console.error('Error in getEarningsStats:', err);
      return {
        totalGrossInr: 0,
        platformFeeInr: 0,
        netPayoutInr: 0,
        pendingEscrowInr: 0,
        completedSessionsCount: 0,
        upcomingSessionsCount: 0,
        payoutHistory: [],
      };
    }
  }
}
