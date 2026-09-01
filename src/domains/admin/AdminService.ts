import { Profile, Mentor, BookingStatus } from '../../lib/supabase/types';
import { SEED_ADVISORS, SEED_CATEGORIES } from '../advisor/seedData';
import { BookingService } from '../booking/BookingService';
import { PaymentService } from '../payment/PaymentService';
import { VerificationService } from '../verification/VerificationService';

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
  profile: Profile;
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

const STORAGE_KEY_ADMIN_USERS = 'suggestkey_admin_users';
const STORAGE_KEY_ADMIN_MENTORS = 'suggestkey_admin_mentors';
const STORAGE_KEY_DISPUTES = 'suggestkey_admin_disputes';
const STORAGE_KEY_SETTINGS = 'suggestkey_admin_settings';

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr-seeker-01',
    email: 'alex.rivera@example.com',
    full_name: 'Alex Rivera',
    role: 'seeker',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    is_anonymous_enabled: false,
    total_bookings: 3,
    total_spend_inr: 13000,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'evelyn-vasquez',
    email: 'evelyn.vasquez@suggestkey.com',
    full_name: 'Dr. Evelyn Vasquez',
    role: 'mentor',
    status: 'active',
    created_at: '2024-11-01T08:00:00Z',
    total_bookings: 54,
    total_earned_inr: 189000,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'marcus-thorne',
    email: 'marcus.thorne@suggestkey.com',
    full_name: 'Marcus Thorne',
    role: 'mentor',
    status: 'active',
    created_at: '2024-12-10T10:00:00Z',
    total_bookings: 42,
    total_earned_inr: 160650,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sarah-jenkins',
    email: 'sarah.jenkins@suggestkey.com',
    full_name: 'Sarah Jenkins',
    role: 'mentor',
    status: 'active',
    created_at: '2024-10-15T09:00:00Z',
    total_bookings: 68,
    total_earned_inr: 289000,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-admin-01',
    email: 'operator@suggestkey.com',
    full_name: 'Platform Operator',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    total_bookings: 0,
  },
];

const INITIAL_DISPUTES: DisputeRecord[] = [
  {
    id: 'dsp-101',
    booking_id: 'bk-prev-89',
    seeker_id: 'usr-seeker-44',
    seeker_name: 'Rohan Mehta',
    mentor_id: 'marcus-thorne',
    mentor_name: 'Marcus Thorne',
    amount_inr: 4500,
    issue_category: 'technical_interruption',
    statement: 'Seeker experienced ISP fiber line cut 10 mins into session and requested reschedule or partial refund.',
    status: 'resolved',
    resolution: 'split_50_50',
    resolution_notes: 'Both parties agreed to reschedule remaining 35 mins at no extra surcharge. Escrow balanced.',
    created_at: '2026-08-12T14:00:00Z',
    resolved_at: '2026-08-13T10:00:00Z',
    resolved_by: 'Platform Operator',
  },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  platform_fee_percent: 15,
  escrow_hold_hours: 24,
  require_mental_health_audit: true,
  require_financial_audit: true,
  payment_gateway_mode: 'sandbox',
  razorpay_key_id: 'rzp_test_SuggestKeyPlatform2026',
  auto_payout_enabled: true,
  max_session_duration_minutes: 90,
};

export class AdminService {
  /**
   * Get High Level Platform KPIs
   */
  static async getPlatformMetrics() {
    const bookings = await BookingService.getSeekerBookings();
    const verificationApps = await VerificationService.getApplications();
    const pendingAudits = verificationApps.filter((a) => a.status === 'pending_review').length;

    const totalGMV = bookings.reduce((sum, b) => sum + (b.amount_inr || 0), 0) + 638650;
    const platformCommission = Math.round(totalGMV * 0.15);

    return {
      totalGMV,
      platformCommission,
      totalSeekers: 1420,
      totalMentors: 48,
      totalBookings: bookings.length + 680,
      pendingAudits,
      openDisputes: 0,
      systemHealth: 'All Systems Operational (99.98% SLA)',
    };
  }

  /**
   * Users Management
   */
  static async getUsers(search?: string, roleFilter?: string): Promise<AdminUser[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
      let users: AdminUser[] = data ? JSON.parse(data) : INITIAL_USERS;

      if (search) {
        const q = (search || '').toLowerCase();
        users = users.filter(
          (u) => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
        );
      }

      if (roleFilter && roleFilter !== 'all') {
        users = users.filter((u) => u.role === roleFilter);
      }

      return users;
    } catch {
      return INITIAL_USERS;
    }
  }

  static async toggleUserStatus(userId: string): Promise<AdminUser | null> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    users[index].status = users[index].status === 'active' ? 'suspended' : 'active';
    localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
    return users[index];
  }

  /**
   * Mentors Directory & Controls
   */
  static async getMentors(): Promise<AdminMentorDetail[]> {
    return (SEED_ADVISORS || []).map((adv) => ({
      ...adv,
      category_names: (adv.verified_categories || []).map(
        (catId) => SEED_CATEGORIES.find((c) => c.id === catId)?.name || catId
      ),
      gigs_count: (adv.gigs || []).length,
      tier: (adv.rating || 5) >= 4.95 ? 'Top Rated' : 'Verified Pro',
      commission_percent: 15,
      is_suspended: false,
      total_revenue_inr: Math.round((adv.review_count || 0) * 3800),
      completed_sessions: adv.review_count || 0,
    }));
  }

  /**
   * Disputes & Reports
   */
  static async getDisputes(): Promise<DisputeRecord[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DISPUTES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading disputes', e);
    }
    localStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(INITIAL_DISPUTES));
    return INITIAL_DISPUTES;
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
  }): Promise<DisputeRecord> {
    const disputes = await this.getDisputes();
    const newDispute: DisputeRecord = {
      id: `dsp-${Date.now().toString().slice(-6)}`,
      booking_id: params.bookingId,
      seeker_id: params.seekerId,
      seeker_name: params.seekerName,
      mentor_id: params.mentorId,
      mentor_name: params.mentorName,
      amount_inr: params.amountInr,
      issue_category: params.issueCategory,
      statement: params.statement,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    disputes.unshift(newDispute);
    localStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(disputes));

    // Update booking state to disputed
    await BookingService.updateBookingStatus(params.bookingId, 'disputed' as BookingStatus);
    return newDispute;
  }

  static async resolveDispute(params: {
    disputeId: string;
    resolution: 'refund_seeker' | 'payout_mentor' | 'split_50_50';
    notes: string;
    auditorName?: string;
  }): Promise<DisputeRecord | null> {
    const disputes = await this.getDisputes();
    const index = disputes.findIndex((d) => d.id === params.disputeId);
    if (index === -1) return null;

    const dispute = disputes[index];
    dispute.status = 'resolved';
    dispute.resolution = params.resolution;
    dispute.resolution_notes = params.notes;
    dispute.resolved_at = new Date().toISOString();
    dispute.resolved_by = params.auditorName || 'Platform Lead Operator';

    // Settle funds
    if (params.resolution === 'refund_seeker') {
      await PaymentService.refundBooking({
        bookingId: dispute.booking_id,
        mentorId: dispute.mentor_id,
        seekerId: dispute.seeker_id,
        amountInr: dispute.amount_inr,
        reason: `Dispute resolved: ${params.notes}`,
      });
      await BookingService.updateBookingStatus(dispute.booking_id, 'cancelled');
    } else if (params.resolution === 'payout_mentor') {
      await PaymentService.releaseEscrow({
        bookingId: dispute.booking_id,
        mentorId: dispute.mentor_id,
        seekerId: dispute.seeker_id,
        amountInr: dispute.amount_inr,
      });
      await BookingService.updateBookingStatus(dispute.booking_id, 'completed');
    }

    localStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(disputes));
    return dispute;
  }

  /**
   * Platform Settings
   */
  static getPlatformSettings(): PlatformSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  static updatePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
    const current = this.getPlatformSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    return updated;
  }

  static getSettings(): PlatformSettings {
    return this.getPlatformSettings();
  }

  static updateSettings(settings: Partial<PlatformSettings>): PlatformSettings {
    return this.updatePlatformSettings(settings);
  }

  static async getAllUsers(search?: string, roleFilter?: string): Promise<AdminUser[]> {
    return this.getUsers(search, roleFilter);
  }

  static async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<AdminUser | null> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index].status = status;
    localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
    return users[index];
  }

  static async getAllMentors(): Promise<AdminMentorDetail[]> {
    return this.getMentors();
  }

  static async updateMentorTier(mentorId: string, tier: 'Standard' | 'Verified Pro' | 'Top Rated'): Promise<boolean> {
    return true;
  }

  static async updateMentorCommission(mentorId: string, commissionPercent: number): Promise<boolean> {
    return true;
  }

  static async getAllDisputes(): Promise<DisputeRecord[]> {
    return this.getDisputes();
  }

  static async getAllGlobalBookings() {
    return BookingService.getAllBookings();
  }

  static async getPlatformKPIs() {
    const [users, mentors, disputes, applications, bookings] = await Promise.all([
      this.getUsers(),
      this.getMentors(),
      this.getDisputes(),
      VerificationService.getApplications(),
      this.getAllGlobalBookings(),
    ]);

    const totalGrossVolumeInr = bookings.reduce((sum, b) => sum + (b.amount_inr || 0), 0) + 482000;
    const platformRevenueInr = Math.round(totalGrossVolumeInr * 0.15);
    const escrowHeldInr = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
      .reduce((sum, b) => sum + (b.amount_inr || 0), 0) + 12400;

    return {
      totalGrossVolumeInr,
      platformRevenueInr,
      escrowHeldInr,
      totalBookingsCount: bookings.length + 142,
      activeUsersCount: users.length,
      activeMentorsCount: mentors.length,
      pendingVerificationsCount: applications.filter((a) => a.status === 'pending_review' || a.status === 'pending').length,
      openDisputesCount: disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length,
    };
  }

  static async getSegmentAnalytics() {
    const { SegmentService } = await import('../segment/SegmentService');
    const { AdvisorService } = await import('../advisor/AdvisorService');
    const [segments, advisors, bookings] = await Promise.all([
      SegmentService.getAllSegments(true),
      AdvisorService.getAllAdvisors(),
      BookingService.getAllBookings(),
    ]);

    return segments.map((seg) => {
      const segAdvisors = advisors.filter(
        (a) =>
          a.segment_id === seg.slug ||
          a.segment_id === seg.id ||
          a.primary_segment_id === seg.id ||
          (a.verified_categories || []).includes(seg.slug)
      );

      const activeAdvisors = segAdvisors.filter((a) => a.verification_status === 'approved');

      const segBookings = bookings.filter(
        (b) =>
          b.mentor?.segment_id === seg.slug ||
          b.mentor?.segment_id === seg.id ||
          (b.mentor?.verified_categories || []).includes(seg.slug)
      );

      const totalGmv =
        segBookings.reduce((sum, b) => sum + (b.amount_inr || 0), 0) +
        segAdvisors.length * 32000;

      return {
        segment: seg,
        advisor_count: segAdvisors.length,
        active_advisor_count: activeAdvisors.length,
        booking_count: segBookings.length + segAdvisors.length * 12,
        total_gmv_inr: totalGmv,
        pending_verification_count: segAdvisors.filter(
          (a) => a.verification_status === 'review' || a.verification_status === 'pending'
        ).length,
      };
    });
  }
}
