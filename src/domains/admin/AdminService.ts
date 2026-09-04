import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Profile, Mentor, Gig, Booking } from '../../lib/supabase/types';
import { SegmentService } from '../segment/SegmentService';
import { BookingService } from '../booking/BookingService';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'seeker' | 'mentor' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  is_anonymous_enabled?: boolean;
  total_bookings: number;
  total_spend_inr?: number;
  total_earned_inr?: number;
  avatar_url?: string;
}

export interface AdminMentorDetail extends Mentor {
  profile?: Profile;
  category_names: string[];
  gigs_count: number;
  tier: 'Standard' | 'Verified Pro' | 'Top Rated';
  commission_percent: number;
  is_suspended: boolean;
  total_revenue_inr: number;
  completed_sessions: number;
}

export interface DisputeRecord {
  id: string;
  booking_id: string;
  seeker_id: string;
  seeker_name: string;
  mentor_id: string;
  mentor_name: string;
  amount_inr: number;
  issue_category: 'no_show' | 'deliverable_missing' | 'quality_dispute' | 'technical_interruption';
  statement: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: 'refund_seeker' | 'payout_mentor' | 'split_50_50';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface PlatformSettings {
  platform_fee_percent: number;
  escrow_hold_hours: number;
  require_mental_health_audit: boolean;
  require_financial_audit: boolean;
  payment_gateway_mode: 'sandbox' | 'live';
  razorpay_key_id: string;
  auto_payout_enabled: boolean;
  max_session_duration_minutes: number;
}

export class AdminService {
  /**
   * Get High Level Platform KPIs from Supabase
   */
  static async getPlatformMetrics() {
    try {
      const [
        { count: seekerCount },
        { count: mentorCount },
        { count: bookingCount },
        { count: pendingVerificationCount },
        { data: bookings },
        { count: openDisputes },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seeker'),
        supabase.from('mentors').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('mentors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('bookings').select('amount_inr, platform_fee_inr'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);

      const totalGMV = bookings?.reduce((sum, b) => sum + (b.amount_inr || 0), 0) || 0;
      const platformCommission = bookings?.reduce((sum, b) => sum + (b.platform_fee_inr || 0), 0) || 0;

      return {
        totalGMV,
        platformCommission,
        totalSeekers: seekerCount || 0,
        totalMentors: mentorCount || 0,
        totalBookings: bookingCount || 0,
        pendingAudits: pendingVerificationCount || 0,
        openDisputes: openDisputes || 0,
        systemHealth: null,
      };
    } catch (err) {
      console.error('Error fetching platform metrics:', err);
      return {
        totalGMV: 0,
        platformCommission: 0,
        totalSeekers: 0,
        totalMentors: 0,
        totalBookings: 0,
        pendingAudits: 0,
        openDisputes: 0,
        systemHealth: null,
      };
    }
  }

  /**
   * Users Management - Fetch from Supabase
   */
  static async getUsers(search?: string, roleFilter?: string): Promise<AdminUser[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty users.');
      return [];
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      const usersWithStats = await Promise.all(
        (data || []).map(async (profile) => {
          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('seeker_id', profile.id);

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            status: 'active' as const,
            created_at: profile.created_at,
            is_anonymous_enabled: profile.is_anonymous_enabled,
            total_bookings: bookingCount || 0,
            avatar_url: profile.avatar_url,
          };
        })
      );

      return usersWithStats;
    } catch (err) {
      console.error('Error in getUsers:', err);
      return [];
    }
  }

  static async toggleUserStatus(userId: string): Promise<AdminUser | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  /**
   * Mentors Directory & Controls - Fetch from Supabase
   */
  static async getMentors(): Promise<AdminMentorDetail[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty mentors.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          profile:profiles(*),
          gigs:gigs(*)
        `)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching mentors:', error);
        return [];
      }

      return (data || []).map((mentor: Mentor & { profile?: Profile; gigs?: Gig[] }) => {
        return {
          ...mentor,
          category_names: mentor.verified_categories?.map((catId: string) =>
            SegmentService.getCachedSegmentBySlug(catId)?.name || catId
          ) || [],
          gigs_count: mentor.gigs?.length || 0,
          tier: (mentor.rating || 0) >= 4.95 ? 'Top Rated' : 'Verified Pro',
          commission_percent: 0,
          is_suspended: false,
          total_revenue_inr: 0,
          completed_sessions: mentor.review_count || 0,
        };
      });
    } catch (err) {
      console.error('Error in getMentors:', err);
      return [];
    }
  }

  /**
   * Get single mentor detail for admin management view
   */
  static async getMentorDetail(mentorId: string): Promise<AdminMentorDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch mentor detail.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          profile:profiles(*),
          gigs:gigs(*),
          mentor_segments:mentor_segments(
            id,
            segment_id,
            status,
            created_at
          )
        `)
        .eq('id', mentorId)
        .single();

      if (error || !data) {
        console.error('Error fetching mentor detail:', error);
        return null;
      }

      const mentor = data as unknown as Mentor & { profile?: Profile; gigs?: Gig[] };

      return {
        ...mentor,
        category_names: mentor.verified_categories?.map((catId: string) =>
          SegmentService.getCachedSegmentBySlug(catId)?.name || catId
        ) || [],
        gigs_count: mentor.gigs?.length || 0,
        tier: (mentor.rating || 0) >= 4.95 ? 'Top Rated' : 'Verified Pro',
        commission_percent: 0,
        is_suspended: false,
        total_revenue_inr: 0,
        completed_sessions: mentor.review_count || 0,
      } as AdminMentorDetail;
    } catch (err) {
      console.error('Error in getMentorDetail:', err);
      return null;
    }
  }

  /**
   * Disputes & Reports - queries the disputes table.
   */
  static async getDisputes(): Promise<DisputeRecord[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disputes:', error);
        return [];
      }

      return (data || []) as DisputeRecord[];
    } catch (err) {
      console.error('Error in getDisputes:', err);
      return [];
    }
  }

  static async createDispute(params: {
    bookingId: string;
    seekerId: string;
    seekerName: string;
    mentorId: string;
    mentorName: string;
    amountInr: number;
    issueCategory: 'no_show' | 'deliverable_missing' | 'quality_dispute' | 'technical_interruption';
    statement: string;
  }): Promise<DisputeRecord | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert({
          booking_id: params.bookingId,
          seeker_id: params.seekerId,
          seeker_name: params.seekerName,
          mentor_id: params.mentorId,
          mentor_name: params.mentorName,
          amount_inr: params.amountInr,
          issue_category: params.issueCategory,
          statement: params.statement,
          status: 'open',
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create dispute.');
      }

      return data as DisputeRecord;
    } catch (err) {
      throw new Error(err?.message || 'Failed to create dispute.');
    }
  }

  static async resolveDispute(params: {
    disputeId: string;
    resolution: 'refund_seeker' | 'payout_mentor' | 'split_50_50';
    notes: string;
    auditorName?: string;
  }): Promise<DisputeRecord | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution: params.resolution,
          resolution_notes: params.notes,
          resolved_at: new Date().toISOString(),
          resolved_by: params.auditorName || null,
        })
        .eq('id', params.disputeId)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to resolve dispute.');
      }

      return data as DisputeRecord;
    } catch (err) {
      throw new Error(err?.message || 'Failed to resolve dispute.');
    }
  }

  /**
   * Platform Settings - read from the platform_settings table.
   * Returns null when no settings row exists yet.
   */
  static async getPlatformSettings(): Promise<PlatformSettings | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data as PlatformSettings;
    } catch (err) {
      console.error('Error in getPlatformSettings:', err);
      return null;
    }
  }

  static async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('platform_settings')
          .update(settings)
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error || !data) return null;
        return data as PlatformSettings;
      } else {
        const { data, error } = await supabase
          .from('platform_settings')
          .insert(settings)
          .select('*')
          .single();
        if (error || !data) return null;
        return data as PlatformSettings;
      }
    } catch (err) {
      console.error('Error in updatePlatformSettings:', err);
      return null;
    }
  }

  static async getSettings(): Promise<PlatformSettings | null> {
    return this.getPlatformSettings();
  }

  static async updateSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings | null> {
    return this.updatePlatformSettings(settings);
  }

  static async getAllUsers(search?: string, roleFilter?: string): Promise<AdminUser[]> {
    return this.getUsers(search, roleFilter);
  }

  static async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<AdminUser | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      const users = await this.getUsers();
      return users.find(u => u.id === userId) || null;
    } catch (err) {
      console.error('Error in updateUserStatus:', err);
      return null;
    }
  }

  static async promoteUserRole(
    userId: string,
    newRole: 'seeker' | 'mentor' | 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { error } = await supabase.rpc('promote_user_role', {
        p_target_user_id: userId,
        p_new_role: newRole,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message || 'Failed to change role' };
    }
  }

  static async getAllMentors(): Promise<AdminMentorDetail[]> {
    return this.getMentors();
  }

  static async updateMentorTier(mentorId: string, tier: 'Standard' | 'Verified Pro' | 'Top Rated'): Promise<AdminMentorDetail | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { error } = await supabase
        .from('mentors')
        .update({ tier })
        .eq('id', mentorId);

      if (error) return null;

      return this.getMentorDetail(mentorId);
    } catch {
      return null;
    }
  }

  static async updateMentorCommission(mentorId: string, commissionPercent: number): Promise<AdminMentorDetail | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { error } = await supabase
        .from('mentors')
        .update({ commission_percent: commissionPercent })
        .eq('id', mentorId);

      if (error) return null;

      return this.getMentorDetail(mentorId);
    } catch {
      return null;
    }
  }

  static async getAllDisputes(): Promise<DisputeRecord[]> {
    return this.getDisputes();
  }

  static async getAllGlobalBookings() {
    return BookingService.getAllBookings();
  }

  static async getPlatformKPIs() {
    if (!isSupabaseConfigured) {
      return {
        totalGrossVolumeInr: 0,
        platformRevenueInr: 0,
        escrowHeldInr: 0,
        totalBookingsCount: 0,
        activeUsersCount: 0,
        activeMentorsCount: 0,
        pendingVerificationsCount: 0,
        openDisputesCount: 0,
      };
    }

    try {
      const [
        { data: bookings },
        { count: userCount },
        { count: mentorCount },
        { count: pendingVerifications },
        { count: openDisputes },
      ] = await Promise.all([
        supabase.from('bookings').select('amount_inr, platform_fee_inr, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('mentors').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('mentors').select('*', { count: 'exact', head: true }).in('verification_status', ['pending', 'review']),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);

      const totalGrossVolumeInr = bookings?.reduce((sum, b) => sum + (b.amount_inr || 0), 0) || 0;
      const platformRevenueInr = bookings?.reduce((sum, b) => sum + (b.platform_fee_inr || 0), 0) || 0;
      const escrowHeldInr = bookings
        ?.filter(b => b.status === 'confirmed' || b.status === 'in_progress')
        .reduce((sum, b) => sum + (b.amount_inr || 0), 0) || 0;

      return {
        totalGrossVolumeInr,
        platformRevenueInr,
        escrowHeldInr,
        totalBookingsCount: bookings?.length || 0,
        activeUsersCount: userCount || 0,
        activeMentorsCount: mentorCount || 0,
        pendingVerificationsCount: pendingVerifications || 0,
        openDisputesCount: openDisputes || 0,
      };
    } catch (err) {
      console.error('Error fetching platform KPIs:', err);
      return {
        totalGrossVolumeInr: 0,
        platformRevenueInr: 0,
        escrowHeldInr: 0,
        totalBookingsCount: 0,
        activeUsersCount: 0,
        activeMentorsCount: 0,
        pendingVerificationsCount: 0,
        openDisputesCount: 0,
      };
    }
  }

  static async updateMentorSegment(mentorId: string, segmentIdOrSlug: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    try {
      const segment = await SegmentService.getSegmentBySlug(segmentIdOrSlug);
      const resolvedId = segment ? segment.id : segmentIdOrSlug;

      const { error } = await supabase
        .from('mentors')
        .update({
          segment_id: resolvedId,
          primary_segment_id: resolvedId,
          verified_categories: segment ? [segment.slug] : [segmentIdOrSlug],
        })
        .eq('id', mentorId);

      return !error;
    } catch (err) {
      console.error('Error updating mentor segment:', err);
      return false;
    }
  }

  static async getSegmentAnalytics() {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const [segments, mentors, bookings] = await Promise.all([
        SegmentService.getAllSegments(true),
        supabase.from('mentors').select('*, gigs:gigs(*)'),
        supabase.from('bookings').select('*'),
      ]);

      const mentorsData = (mentors.data || []) as (Mentor & { gigs?: Gig[] })[];
      const bookingsData = (bookings.data || []) as Booking[];

      return segments.map((seg) => {
        const segAdvisors = mentorsData.filter(
          (a) =>
            a.segment_id === seg.id ||
            a.primary_segment_id === seg.id ||
            a.verified_categories?.includes(seg.slug)
        );

        const activeAdvisors = segAdvisors.filter((a) => a.verification_status === 'approved');

        const segBookings = bookingsData.filter(
          (b) => b.segment_id === seg.id
        );

        const totalGmv = segBookings.reduce((sum: number, b) => sum + (b.amount_inr || 0), 0);

        return {
          segment: seg,
          advisor_count: segAdvisors.length,
          active_advisor_count: activeAdvisors.length,
          booking_count: segBookings.length,
          total_gmv_inr: totalGmv,
          pending_verification_count: segAdvisors.filter(
            (a) => a.verification_status === 'review' || a.verification_status === 'pending'
          ).length,
        };
      });
    } catch (err) {
      console.error('Error fetching segment analytics:', err);
      return [];
    }
  }
}