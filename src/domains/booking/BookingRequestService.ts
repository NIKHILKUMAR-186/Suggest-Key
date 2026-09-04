import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { BookingRequest, BookingAuditLog } from '../../lib/supabase/types';

export interface BookingRequestWithDetails {
  id: string;
  offering_id: string;
  mentor_id: string;
  seeker_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  proposed_start_time: string;
  proposed_end_time: string;
  confirmed_start_time?: string | null;
  confirmed_end_time?: string | null;
  meeting_url?: string | null;
  message?: string | null;
  notes?: string | null;
  amount_inr: number;
  platform_fee_inr?: number;
  mentor_payout_inr?: number;
  is_anonymous?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  offering?: {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    price_inr: number;
    deliverables: string[];
    mentor_segment: {
      segment: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
  mentor?: {
    id: string;
    profile: {
      id: string;
      full_name: string;
      avatar_url?: string | null;
    };
  };
  seeker?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
  audit_log?: BookingAuditLog[];
}

export class BookingRequestService {
  /**
   * Create a new booking request (seeker -> mentor)
   * Uses the server-side create_booking_request function for atomicity.
   * The seeker is always auth.uid() — p_seeker_id is no longer a parameter.
   */
  static async createBookingRequest(params: {
    offeringId: string;
    startTime: string;
    endTime: string;
    message?: string;
    isAnonymous?: boolean;
  }): Promise<{ success: boolean; bookingRequestId?: string; error?: string; message?: string }> {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Database is not configured. Cannot create booking request.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('create_booking_request', {
        p_offering_id: params.offeringId,
        p_proposed_start_time: params.startTime,
        p_proposed_end_time: params.endTime,
        p_message: params.message || null,
        p_is_anonymous: params.isAnonymous ?? false,
      });

      if (error) {
        console.error('Error creating booking request:', error);
        return {
          success: false,
          error: error.code || 'RPC_ERROR',
          message: error.message || 'Failed to create booking request.',
        };
      }

      if (data?.success === false) {
        return {
          success: false,
          error: data.error,
          message: data.message,
        };
      }

      return {
        success: true,
        bookingRequestId: data.booking_request_id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('Error in createBookingRequest:', err);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message,
      };
    }
  }

  /**
   * Get all booking requests for the current user
   */
  static async getUserBookingRequests(userId: string): Promise<BookingRequestWithDetails[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty booking requests.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          offering:offerings(
            id,
            title,
            description,
            duration_minutes,
            price_inr,
            deliverables,
            mentor_segment:mentor_segments(
              id,
              segment:advisory_segments(id, name, slug)
            )
          ),
          mentor:mentors!inner(
            id,
            profile:profiles(id, full_name, avatar_url)
          ),
          seeker:profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user booking requests:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserBookingRequests:', err);
      return [];
    }
  }

  /**
   * Get a single booking request by ID
   */
  static async getBookingRequestById(bookingRequestId: string): Promise<BookingRequestWithDetails | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch booking request.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          offering:offerings(
            id,
            title,
            description,
            duration_minutes,
            price_inr,
            deliverables,
            mentor_segment:mentor_segments(
              id,
              segment:advisory_segments(id, name, slug)
            )
          ),
          mentor:mentors!inner(
            id,
            profile:profiles(id, full_name, avatar_url)
          ),
          seeker:profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (error || !data) {
        console.error('Error fetching booking request:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getBookingRequestById:', err);
      return null;
    }
  }

  /**
   * Get booking requests for a mentor (all requests they've received)
   */
  static async getMentorBookingRequests(mentorId: string): Promise<BookingRequestWithDetails[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty booking requests.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          offering:offerings(
            id,
            title,
            description,
            duration_minutes,
            price_inr,
            deliverables,
            mentor_segment:mentor_segments(
              id,
              segment:advisory_segments(id, name, slug)
            )
          ),
          mentor:mentors!inner(
            id,
            profile:profiles(id, full_name, avatar_url)
          ),
          seeker:profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentor booking requests:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getMentorBookingRequests:', err);
      return [];
    }
  }

  /**
   * Get booking requests for a seeker
   */
  static async getSeekerBookingRequests(seekerId: string): Promise<BookingRequestWithDetails[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty booking requests.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          offering:offerings(
            id,
            title,
            description,
            duration_minutes,
            price_inr,
            deliverables,
            mentor_segment:mentor_segments(
              id,
              segment:advisory_segments(id, name, slug)
            )
          ),
          mentor:mentors!inner(
            id,
            profile:profiles(id, full_name, avatar_url)
          ),
          seeker:profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('seeker_id', seekerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seeker booking requests:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getSeekerBookingRequests:', err);
      return [];
    }
  }

  /**
   * Update booking request status (accept, decline, cancel)
   * Uses server-side update_booking_request_status function for authorization enforcement
   */
  static async updateBookingRequestStatus(
    bookingRequestId: string,
    newStatus: 'accepted' | 'declined' | 'cancelled',
    options?: {
      confirmedStartTime?: string;
      confirmedEndTime?: string;
      meetingUrl?: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    bookingRequestId?: string;
    newStatus?: string;
    oldStatus?: string;
    error?: string;
  }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.rpc('update_booking_request_status', {
        p_booking_request_id: bookingRequestId,
        p_new_status: newStatus,
        p_confirmed_start_time: options?.confirmedStartTime || null,
        p_confirmed_end_time: options?.confirmedEndTime || null,
        p_meeting_url: options?.meetingUrl || null,
        p_notes: options?.notes || null,
      });

      if (error) {
        console.error('Error updating booking request status:', error);
        return { success: false, error: error.message };
      }

      if (data?.success === false) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        bookingRequestId: data.booking_request_id,
        newStatus: data.new_status,
        oldStatus: data.old_status,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking request';
      console.error('Error in updateBookingRequestStatus:', err);
      return { success: false, error: message };
    }
  }

  /**
   * Get booking requests with a specific status for a user
   */
  static async getBookingRequestsByStatus(
    userId: string,
    status: 'pending' | 'accepted' | 'declined' | 'cancelled',
    role: 'seeker' | 'mentor'
  ): Promise<BookingRequestWithDetails[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      let query = supabase.from('booking_requests').select(`
          *,
          offering:offerings(
            id,
            title,
            description,
            duration_minutes,
            price_inr,
            deliverables
          ),
          mentor:mentors!inner(id),
          seeker:profiles!inner(id, full_name, avatar_url)
        `);

      const column = role === 'mentor' ? 'mentor_id' : 'seeker_id';
      query = query.eq(column, userId).eq('status', status);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching booking requests by status:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getBookingRequestsByStatus:', err);
      return [];
    }
  }

  /**
   * Cancel a booking request as the seeker. Preserves history (status set to 'cancelled').
   */
  static async cancelBookingRequest(
    bookingRequestId: string
  ): Promise<{ success: boolean; bookingRequestId?: string; newStatus?: string; oldStatus?: string; error?: string; message?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }

    try {
      const { data, error } = await supabase.rpc('cancel_booking_request', {
        p_booking_request_id: bookingRequestId,
      });

      if (error) {
        console.error('Error cancelling booking request:', error);
        return { success: false, error: error.code || 'RPC_ERROR', message: error.message };
      }

      if (data?.success === false) {
        return { success: false, error: data.error, message: data.message };
      }

      return {
        success: true,
        bookingRequestId: data.booking_request_id,
        newStatus: data.new_status,
        oldStatus: data.old_status,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      console.error('Error in cancelBookingRequest:', err);
      return { success: false, error: 'INTERNAL_ERROR', message };
    }
  }

  /**
   * Acquire a 5-minute slot lock via RPC (DB-enforced).
   */
  static async acquireSlotLock(
    mentorId: string,
    startTime: string,
    endTime: string
  ): Promise<{ success: boolean; lockId?: string; expiresAt?: string; error?: string; message?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }

    try {
      const { data, error } = await supabase.rpc('acquire_slot_lock', {
        p_mentor_id: mentorId,
        p_start_time: startTime,
        p_end_time: endTime,
      });

      if (error) {
        return { success: false, error: error.code || 'RPC_ERROR', message: error.message };
      }

      if (data?.success === false) {
        return { success: false, error: data.error, message: data.message };
      }

      return { success: true, lockId: data.lock_id, expiresAt: data.expires_at };
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      return { success: false, error: 'INTERNAL_ERROR', message };
    }
  }

  /**
   * Release a slot lock.
   */
  static async releaseSlotLock(lockId: string): Promise<{ success: boolean }> {
    if (!isSupabaseConfigured) return { success: false };
    try {
      await supabase.rpc('release_slot_lock', { p_lock_id: lockId });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Get the audit log for a booking request
   */
  static async getBookingRequestAuditLog(bookingRequestId: string): Promise<BookingAuditLog[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('booking_audit_log')
        .select('*')
        .eq('booking_request_id', bookingRequestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getBookingRequestAuditLog:', err);
      return [];
    }
  }
}
