import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Booking, BookingStatus, Gig, Profile, Mentor } from '../../lib/supabase/types';
import { AvailabilityService } from './AvailabilityService';
import { SegmentService } from '../segment/SegmentService';

export interface EnrichedBooking extends Booking {
  gig?: Gig;
  mentor?: Mentor & { profile?: Profile };
  seeker?: Profile;
  platform_fee_inr?: number;
  mentor_payout_inr?: number;
  payment_status?: string;
  deliverables_shared?: string[];
  session_notes?: string;
  is_anonymous?: boolean;
}

export class BookingService {
  /**
   * Get all bookings for a seeker from Supabase
   */
  static async getSeekerBookings(seekerId?: string): Promise<EnrichedBooking[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty bookings.');
      return [];
    }

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .order('start_time', { ascending: false });

      if (seekerId) {
        query = query.eq('seeker_id', seekerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching seeker bookings:', error);
        return [];
      }

      return (data || []).map(this.enrichBooking);
    } catch (err) {
      console.error('Error in getSeekerBookings:', err);
      return [];
    }
  }

  /**
   * Get all bookings for a mentor from Supabase
   */
  static async getMentorBookings(mentorId?: string): Promise<EnrichedBooking[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty bookings.');
      return [];
    }

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .order('start_time', { ascending: false });

      if (mentorId) {
        query = query.eq('mentor_id', mentorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching mentor bookings:', error);
        return [];
      }

      return (data || []).map(this.enrichBooking);
    } catch (err) {
      console.error('Error in getMentorBookings:', err);
      return [];
    }
  }

  /**
   * Get booking by ID from Supabase
   */
  static async getBookingById(bookingId: string): Promise<EnrichedBooking | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch booking.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error || !data) {
        console.error('Error fetching booking:', error);
        return null;
      }

      return this.enrichBooking(data);
    } catch (err) {
      console.error('Error in getBookingById:', err);
      return null;
    }
  }

  /**
   * Create a new booking with conflict detection
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
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Database is not configured. Cannot create booking.',
      };
    }

    try {
      // Fetch the gig details
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', params.gigId)
        .single();

      if (gigError || !gigData) {
        return {
          success: false,
          error: 'GIG_NOT_FOUND',
          message: 'The selected session offering was not found.',
        };
      }

      // Check for booking conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('mentor_id', params.mentorId)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .lt('start_time', params.endTime)
        .gt('end_time', params.startTime);

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError);
      }

      if (conflicts && conflicts.length > 0) {
        return {
          success: false,
          error: 'SLOT_CONFLICT',
          message: 'This time slot has just been confirmed by another client. Please select an alternate schedule.',
        };
      }

      // Calculate fees
      const platformFee = Math.round(gigData.price_inr * 0.15);
      const mentorPayout = gigData.price_inr - platformFee;

      // Create the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          seeker_id: params.seekerId,
          mentor_id: params.mentorId,
          gig_id: params.gigId,
          segment_id: gigData.segment_id,
          start_time: params.startTime,
          end_time: params.endTime,
          status: 'confirmed',
          amount_inr: gigData.price_inr,
          platform_fee_inr: platformFee,
          mentor_payout_inr: mentorPayout,
          meeting_url: `https://meet.google.com/sk-${Math.random().toString(36).substring(2, 7)}`,
          notes: params.notes || '1:1 Advisory Consultation',
          is_anonymous: params.isAnonymous ?? false,
        })
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .single();

      if (bookingError || !bookingData) {
        if (bookingError?.message?.includes('exclusion')) {
          return {
            success: false,
            error: 'SLOT_CONFLICT',
            message: 'This time slot has just been confirmed by another client. Please select an alternate schedule.',
          };
        }
        return {
          success: false,
          error: 'BOOKING_FAILED',
          message: bookingError?.message || 'Failed to create booking.',
        };
      }

      // Create conversation for this booking
      await supabase
        .from('conversations')
        .insert({
          booking_id: bookingData.id,
          seeker_id: params.seekerId,
          mentor_id: params.mentorId,
          segment_id: gigData.segment_id,
        });

      // Release slot lock if provided
      if (params.lockId) {
        AvailabilityService.releaseLock(params.lockId);
      }

      return {
        success: true,
        booking: this.enrichBooking(bookingData),
      };
    } catch (err: any) {
      console.error('Error in createAtomicBooking:', err);
      return {
        success: false,
        error: 'BOOKING_ERROR',
        message: err.message || 'An unexpected error occurred while creating the booking.',
      };
    }
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
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot update booking.');
      return null;
    }

    try {
      const updateData: any = { status };

      if (extra?.session_notes !== undefined) {
        updateData.notes = extra.session_notes;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .single();

      if (error || !data) {
        console.error('Error updating booking status:', error);
        return null;
      }

      return this.enrichBooking(data);
    } catch (err) {
      console.error('Error in updateBookingStatus:', err);
      return null;
    }
  }

  /**
   * Get all bookings (admin use)
   */
  static async getAllBookings(): Promise<EnrichedBooking[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty bookings.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          gig:gigs(*),
          mentor:mentors(*, profile:profiles(*)),
          seeker:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bookings:', error);
        return [];
      }

      return (data || []).map(this.enrichBooking);
    } catch (err) {
      console.error('Error in getAllBookings:', err);
      return [];
    }
  }

  /**
   * Get booking statistics for admin dashboard
   */
  static async getBookingStats(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    platformRevenue: number;
  }> {
    if (!isSupabaseConfigured) {
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        platformRevenue: 0,
      };
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, amount_inr, platform_fee_inr');

      if (error || !data) {
        console.error('Error fetching booking stats:', error);
        return {
          totalBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          platformRevenue: 0,
        };
      }

      const stats = {
        totalBookings: data.length,
        confirmedBookings: data.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
        completedBookings: data.filter(b => b.status === 'completed').length,
        cancelledBookings: data.filter(b => b.status === 'cancelled').length,
        totalRevenue: data.reduce((sum, b) => sum + (b.amount_inr || 0), 0),
        platformRevenue: data.reduce((sum, b) => sum + (b.platform_fee_inr || 0), 0),
      };

      return stats;
    } catch (err) {
      console.error('Error in getBookingStats:', err);
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        platformRevenue: 0,
      };
    }
  }

  /**
   * Enrich booking data with computed fields
   */
  private static enrichBooking(raw: any): EnrichedBooking {
    const booking: EnrichedBooking = {
      ...raw,
      platform_fee_inr: raw.platform_fee_inr || Math.round((raw.amount_inr || 0) * 0.15),
      mentor_payout_inr: raw.mentor_payout_inr || Math.round((raw.amount_inr || 0) * 0.85),
      payment_status: raw.payment_status || 'paid',
    };

    return booking;
  }
}
