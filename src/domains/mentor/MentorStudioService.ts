import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Gig, Offering, MentorSegment } from '../../lib/supabase/types';
import { SegmentService } from '../segment/SegmentService';

export interface AvailabilitySlotRule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
}

export interface MentorEarningsStats {
  totalGrossInr: number;
  platformFeeInr: number;
  netPayoutInr: number;
  pendingEscrowInr: number;
  completedSessionsCount: number;
  upcomingSessionsCount: number;
  avgRating?: number;
  reviewCount?: number;
  payoutHistory: {
    id: string;
    date: string;
    amountInr: number;
    status: 'transferred' | 'processing' | 'pending';
    bankAccountEnding: string;
    utrNumber: string;
  }[];
}

interface AvailabilityRuleRow {
  mentor_id: string;
  day_of_week: AvailabilitySlotRule['dayOfWeek'];
  is_enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
}

const DAY_NAMES: AvailabilitySlotRule['dayOfWeek'][] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
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

    const segment = await SegmentService.getSegmentBySlug(gigData.segment_id);
    if (!segment) {
      const err: Error & { code: string } = Object.assign(
        new Error('Selected segment does not exist.'),
        { code: 'SEGMENT_NOT_FOUND' }
      );
      throw err;
    }
    if (!segment.is_active) {
      const err: Error & { code: string } = Object.assign(
        new Error(
          'Cannot save gig: selected segment is not active. Mentors can only create gigs under active admin-managed segments.'
        ),
        { code: 'ACTIVE_SEGMENT_REQUIRED' }
      );
      throw err;
    }

    const isEdit = Boolean(gigData.id);

    if (isEdit) {
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
   * Get availability schedule from the availability_rules table.
   */
  static async getAvailability(mentorId: string): Promise<AvailabilitySlotRule[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty availability.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('mentor_id', mentorId);

      if (error || !data) {
        console.error('Error fetching availability rules:', error);
        return [];
      }

      return (data as AvailabilityRuleRow[]).map((row) => ({
        dayOfWeek: row.day_of_week,
        enabled: !!row.is_enabled,
        startTime: row.start_time,
        endTime: row.end_time,
        slotDurationMinutes: row.slot_duration_minutes,
        bufferMinutes: row.buffer_minutes,
      }));
    } catch (err) {
      console.error('Error in getAvailability:', err);
      return [];
    }
  }

  /**
   * Save availability schedule to the availability_rules table.
   */
  static async saveAvailability(
    mentorId: string,
    rules: AvailabilitySlotRule[]
  ): Promise<AvailabilitySlotRule[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot save availability.');
    }

    try {
      const upsertRows = rules.map((rule) => ({
        mentor_id: mentorId,
        day_of_week: rule.dayOfWeek,
        is_enabled: rule.enabled,
        start_time: rule.startTime,
        end_time: rule.endTime,
        slot_duration_minutes: rule.slotDurationMinutes,
        buffer_minutes: rule.bufferMinutes,
      }));

      const { error } = await supabase
        .from('availability_rules')
        .upsert(upsertRows, { onConflict: 'mentor_id,day_of_week' });

      if (error) {
        throw new Error(error.message || 'Failed to save availability rules.');
      }

      return rules;
    } catch (err) {
      console.error('Error in saveAvailability:', err);
      throw err;
    }
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
      const { data: completedBookings, error: completedError } = await supabase
        .from('bookings')
        .select('amount_inr, platform_fee_inr, mentor_payout_inr')
        .eq('mentor_id', mentorId)
        .eq('status', 'completed');

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
        payoutHistory: [],
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

  static async getMentorSegments(mentorId: string): Promise<MentorSegment[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty segments.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mentor_segments')
        .select('*, segment:advisory_segments(*)')
        .eq('mentor_id', mentorId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching mentor segments:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getMentorSegments:', err);
      return [];
    }
  }

  static async getMentorOfferings(mentorId: string): Promise<Offering[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty offerings.');
      return [];
    }

    try {
      const { data: msData, error: msError } = await supabase
        .from('mentor_segments')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('status', 'active');

      if (msError || !msData || msData.length === 0) {
        return [];
      }

      const msIds = msData.map((ms) => ms.id);

      const { data: offeringsData, error: offeringsError } = await supabase
        .from('offerings')
        .select('*, mentor_segment:mentor_segments(*, segment:advisory_segments(*))')
        .in('mentor_segment_id', msIds)
        .order('created_at', { ascending: false });

      if (offeringsError) {
        console.error('Error fetching offerings:', offeringsError);
        return [];
      }

      return offeringsData || [];
    } catch (err) {
      console.error('Error in getMentorOfferings:', err);
      return [];
    }
  }

  static async getOfferingById(offeringId: string, mentorId?: string): Promise<Offering | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch offering.');
      return null;
    }

    try {
      let query = supabase
        .from('offerings')
        .select(`
          *,
          mentor_segment:mentor_segments(*, segment:advisory_segments(*))
        `)
        .or(`id.eq.${offeringId},slug.eq.${offeringId}`);

      if (mentorId) {
        query = query.eq('mentor_segment.mentor_id', mentorId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Error fetching offering:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getOfferingById:', err);
      return null;
    }
  }

  static async saveOffering(
    offeringData: Partial<Offering> & { id?: string; mentor_segment_id: string },
    mentorId: string
  ): Promise<Offering> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot save offering.');
    }

    if (!mentorId) {
      throw new Error('Mentor ID is required to save an offering.');
    }

    if (!offeringData.mentor_segment_id) {
      throw new Error('A mentor segment ID is required to create an offering.');
    }

    if (!offeringData.title || !offeringData.title.trim()) {
      throw new Error('Offering title is required.');
    }

    if (!offeringData.duration_minutes || !offeringData.price_inr) {
      throw new Error('Duration and price are required.');
    }

    const { data: msCheck, error: msCheckError } = await supabase
      .from('mentor_segments')
      .select('id')
      .eq('id', offeringData.mentor_segment_id)
      .eq('mentor_id', mentorId)
      .eq('status', 'active')
      .single();

    if (msCheckError || !msCheck) {
      throw new Error('You do not have permission to create offerings in this segment.');
    }

    const isEdit = Boolean(offeringData.id);

    if (isEdit) {
      const { data, error } = await supabase
        .from('offerings')
        .update({
          title: offeringData.title.trim(),
          description: offeringData.description?.trim() || '',
          duration_minutes: offeringData.duration_minutes,
          price_inr: offeringData.price_inr,
          deliverables: offeringData.deliverables || [],
          is_available: offeringData.is_available,
        })
        .eq('id', offeringData.id)
        .select(`
          *,
          mentor_segment:mentor_segments(*, segment:advisory_segments(*))
        `)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Cannot update offering: you do not have permission.');
      }

      return data;
    } else {
      const slug = offeringData.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('offerings')
        .insert({
          mentor_segment_id: offeringData.mentor_segment_id,
          title: offeringData.title.trim(),
          slug: slug || `offering-${Date.now()}`,
          description: offeringData.description?.trim() || '',
          duration_minutes: offeringData.duration_minutes,
          price_inr: offeringData.price_inr,
          deliverables: offeringData.deliverables || [],
          is_available: offeringData.is_available ?? true,
        })
        .select(`
          *,
          mentor_segment:mentor_segments(*, segment:advisory_segments(*))
        `)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create offering.');
      }

      return data;
    }
  }

  static async deleteOffering(offeringId: string, mentorId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot delete offering.');
    }

    const { error } = await supabase
      .from('offerings')
      .delete()
      .eq('id', offeringId)
      .eq('mentor_segment_id', (query) =>
        query.from('mentor_segments').select('id').eq('mentor_id', mentorId)
      );

    if (error) {
      throw new Error(error.message || 'Cannot delete offering: you do not have permission.');
    }

    return true;
  }

  static async setOfferingAvailability(
    offeringId: string,
    isAvailable: boolean,
    mentorId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('offerings')
      .update({ is_available: isAvailable })
      .eq('id', offeringId)
      .eq('mentor_segment_id', (query) =>
        query.from('mentor_segments').select('id').eq('mentor_id', mentorId)
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export { DAY_NAMES };