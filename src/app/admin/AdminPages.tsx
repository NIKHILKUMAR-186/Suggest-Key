import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import {
  AdminService,
  AdminUser,
  AdminMentorDetail,
  DisputeRecord,
  PlatformSettings,
} from '../../domains/admin/AdminService';
import { VerificationService, MentorVerificationRequest } from '../../domains/verification/VerificationService';
import { BookingService, EnrichedBooking } from '../../domains/booking/BookingService';
import { PaymentService, LedgerTransaction } from '../../domains/payment/PaymentService';
import { SegmentService } from '../../domains/segment/SegmentService';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import {
  ShieldAlert,
  Users,
  Award,
  FileCheck2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Sliders,
  Download,
  Lock,
  RefreshCw,
  Edit,
  Save,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Building,
  CreditCard,
  Layers,
  Sparkles,
} from 'lucide-react';

export { AdminSegmentsPage } from './AdminSegmentsPage';

/* ==========================================================================
   1. ADMIN OVERVIEW / OPERATOR CONSOLE
   ========================================================================== */
export const AdminOverviewPage: React.FC = () => {
  const [kpis, setKpis] = useState<{
    totalGrossVolumeInr: number;
    platformRevenueInr: number;
    escrowHeldInr: number;
    totalBookingsCount: number;
    activeUsersCount: number;
    activeMentorsCount: number;
    pendingVerificationsCount: number;
    openDisputesCount: number;
  } | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<MentorVerificationRequest[]>([]);
  const [openDisputes, setOpenDisputes] = useState<DisputeRecord[]>([]);
  const [recentBookings, setRecentBookings] = useState<EnrichedBooking[]>([]);
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [kpiData, vQueue, disputes, bookings, segmentData] = await Promise.all([
        AdminService.getPlatformKPIs(),
        VerificationService.getAllRequests(),
        AdminService.getAllDisputes(),
        AdminService.getAllGlobalBookings(),
        SegmentService.getAllSegments(true),
      ]);
      setKpis(kpiData);
      setVerificationQueue(vQueue.filter((v) => v.status === 'pending'));
      setOpenDisputes(disputes.filter((d) => d.status === 'open' || d.status === 'investigating'));
      setRecentBookings((bookings || []).slice(0, 5));
      setSegments(segmentData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleApproveVerification = async (reqId: string, mentorName: string) => {
    const res = await VerificationService.approveRequest(reqId, 'Platform Operator');
    if (res) {
      setVerificationQueue((prev) => prev.filter((v) => v.id !== reqId));
      toast({
        title: 'Credential Approved',
        description: `${mentorName} has been certified and verified for client bookings.`,
      });
    }
  };

  const handleRejectVerification = async (reqId: string) => {
    const res = await VerificationService.rejectRequest(reqId, 'Insufficient licensing verification proof.', 'Platform Operator');
    if (res) {
      setVerificationQueue((prev) => prev.filter((v) => v.id !== reqId));
      toast({
        title: 'Credential Rejected',
        description: 'Notice sent to mentor with request for resubmission.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="space-y-2 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#ffb829] font-semibold px-2.5 py-0.5 rounded-full bg-[#ffb829]/10 border border-[#ffb829]/20">
              Operator Console
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#15846e] font-semibold px-2.5 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/20">
              Atomic Booking Active
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mt-2">Platform Overview</h1>
          <p className="text-sm text-[#9a9a9a] max-w-2xl leading-relaxed">
            Real-time platform financial metrics, mandatory credential verification audits, escrow management, and dispute settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/verification"
            className="px-5 py-2.5 bg-[#ffb829] hover:bg-[#e6a524] text-black rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Audit Queue ({verificationQueue.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Gross Escrow Volume</span>
            <DollarSign className="w-4 h-4 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-medium text-white">
            ₹{(kpis?.totalGrossVolumeInr || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#9a9a9a]">Cumulative transacted client fees</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Platform Take-Rate (15%)</span>
            <TrendingUp className="w-4 h-4 text-[#15846e]" />
          </div>
          <div className="text-3xl font-medium text-[#15846e]">
            ₹{(kpis?.platformRevenueInr || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#9a9a9a]">Net Suggest Key commissions</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Active Specialists</span>
            <Award className="w-4 h-4 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-medium text-[#8052ff]">{kpis?.activeMentorsCount}</div>
          <p className="text-[11px] text-[#9a9a9a]">Audited & publish-approved</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Pending Credential Audits</span>
            <ShieldAlert className="w-4 h-4 text-[#ffb829]" />
          </div>
          <div className="text-3xl font-medium text-[#ffb829]">{kpis?.pendingVerificationsCount}</div>
          <p className="text-[11px] text-[#9a9a9a]">Requiring operator sign-off</p>
        </div>
      </div>

      {/* Verification Queue Section */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#ffb829]" />
              <span>Priority Credential Verification Queue</span>
            </h2>
            <p className="text-xs text-[#9a9a9a]">
              Mentors in regulated categories (Mental Health, Legal, Wealth) require verified licensing.
            </p>
          </div>
          <Link
            to="/admin/verification"
            className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline"
          >
            View All ({verificationQueue.length}) →
          </Link>
        </div>

        {verificationQueue.length > 0 ? (
          <div className="space-y-3">
            {verificationQueue.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-white">{req.mentor_name}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#8052ff]/10 text-[#8052ff] border border-[#8052ff]/20">
                      {req.category_name}
                    </span>
                    <span className="text-xs text-[#9a9a9a]">Board: {req.licensing_board}</span>
                  </div>
                  <div className="text-xs text-[#bdbdbd]">
                    License #{req.license_number} • Submitted{' '}
                    {new Date(req.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveVerification(req.id, req.mentor_name)}
                    className="px-4 py-2 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectVerification(req.id)}
                    className="px-4 py-2 rounded-full border border-white/15 hover:bg-white/10 text-[#9a9a9a] hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-[#9a9a9a]">
            ✓ All specialist credential applications are up to date. Zero pending audits.
          </div>
        )}
      </div>

      {/* Advisory Domains Distribution Matrix */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8052ff]" />
              <span>Live Advisory Domains & Segments</span>
            </h2>
            <p className="text-xs text-[#9a9a9a]">
              Dynamic database taxonomy driving seeker discovery, segment switchers, and specialist matching.
            </p>
          </div>
          <Link
            to="/admin/segments"
            className="px-4 py-1.5 rounded-full bg-[#8052ff]/10 hover:bg-[#8052ff]/20 text-[#8052ff] border border-[#8052ff]/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Manage Segments ({segments.length})</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className={`p-4 rounded-2xl border bg-white/[0.01] space-y-3 transition-all ${
                seg.is_active ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg border flex items-center justify-center"
                    style={{
                      backgroundColor: `${seg.accent}15`,
                      borderColor: `${seg.accent}30`,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: seg.accent }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{seg.name}</h4>
                    <span className="text-[10px] font-mono text-[#707070]">slug: {seg.slug}</span>
                  </div>
                </div>

                <span
                  className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                    seg.is_active
                      ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                      : 'text-[#9a9a9a] border-white/10 bg-white/5'
                  }`}
                >
                  {seg.is_active ? 'Active' : 'Archived'}
                </span>
              </div>

              <p className="text-xs text-[#9a9a9a] line-clamp-2 leading-relaxed font-light">
                {seg.short_description}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-[#707070]">Order #{seg.display_order}</span>
                <Link
                  to={`/seeker/discover?segment=${seg.slug}`}
                  target="_blank"
                  className="text-[#8052ff] hover:underline"
                >
                  Seeker View ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Recent Bookings & Open Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Atomic Bookings */}
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8052ff]" />
              <span>Recent Atomic Bookings</span>
            </h3>
            <Link to="/admin/bookings" className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline">
              Ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="text-white font-medium">{b.gig.title}</div>
                  <div className="text-[#9a9a9a] text-[11px]">
                    Advisor: {b.mentor.full_name} • Seeker: {b.seeker_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">₹{(b.amount_inr || 0).toLocaleString()}</div>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed'
                        ? 'text-[#15846e] bg-[#15846e]/10'
                        : b.status === 'completed'
                        ? 'text-[#8052ff] bg-[#8052ff]/10'
                        : 'text-[#9a9a9a] bg-white/5'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispute Resolution Queue */}
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffb829]" />
              <span>Escrow Disputes & Reports</span>
            </h3>
            <Link to="/admin/reports" className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline">
              All Reports →
            </Link>
          </div>

          {openDisputes.length > 0 ? (
            <div className="space-y-3">
              {openDisputes.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300">Ticket #{d.id} • {d.issue_category}</span>
                    <span className="text-white font-medium">₹{(d.amount_inr || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[#bdbdbd] line-clamp-2">{d.statement}</p>
                  <div className="flex justify-end pt-1">
                    <Link
                      to="/admin/reports"
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase font-semibold"
                    >
                      Arbitrate Case →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-[#9a9a9a]">
              ✓ No open escrow disputes or client conduct reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   2. ADMIN USERS DIRECTORY PAGE
   ========================================================================== */
export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'seeker' | 'mentor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const data = await AdminService.getAllUsers();
      setUsers(data);
      setLoading(false);
    }
    loadUsers();
  }, []);

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = await AdminService.updateUserStatus(user.id, nextStatus);
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast({
        title: 'Account Status Updated',
        description: `${user.full_name} is now marked as ${nextStatus}.`,
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal text-white">User & Participant Directory</h1>
        <p className="text-sm text-[#9a9a9a]">
          Inspect platform accounts, enforce platform terms, manage user roles, and audit access permissions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9a9a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-[#9a9a9a] focus:outline-none focus:border-[#8052ff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
            {(['all', 'seeker', 'mentor', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs uppercase font-medium transition-all ${
                  roleFilter === r ? 'bg-white/10 text-white shadow-sm' : 'text-[#9a9a9a] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
            {(['all', 'active', 'suspended'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs uppercase font-medium transition-all ${
                  statusFilter === s ? 'bg-white/10 text-white shadow-sm' : 'text-[#9a9a9a] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[#9a9a9a] uppercase tracking-wider font-medium">
              <tr>
                <th className="p-4 pl-6">Participant</th>
                <th className="p-4">Role</th>
                <th className="p-4">Total Activity</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8052ff]/20 text-[#8052ff] flex items-center justify-center font-bold text-xs uppercase">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.full_name}</div>
                        <div className="text-[11px] text-[#9a9a9a]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`uppercase font-semibold text-[10px] px-2.5 py-0.5 rounded-full border ${
                        user.role === 'admin'
                          ? 'text-[#ffb829] border-[#ffb829]/30 bg-[#ffb829]/10'
                          : user.role === 'mentor'
                          ? 'text-[#8052ff] border-[#8052ff]/30 bg-[#8052ff]/10'
                          : 'text-[#bdbdbd] border-white/10 bg-white/5'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-[#bdbdbd]">
                    {user.total_bookings} Bookings
                    {user.total_spend_inr ? ` • ₹${(user.total_spend_inr || 0).toLocaleString()} Spent` : ''}
                    {user.total_earned_inr ? ` • ₹${(user.total_earned_inr || 0).toLocaleString()} Earned` : ''}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase ${
                        user.status === 'active' ? 'text-[#15846e]' : 'text-rose-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[#15846e]' : 'bg-rose-400'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1 rounded-full text-[11px] uppercase font-semibold transition-all ${
                          user.status === 'active'
                            ? 'border border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                            : 'border border-[#15846e]/30 text-[#15846e] hover:bg-[#15846e]/10'
                        }`}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   3. ADMIN MENTORS DIRECTORY PAGE
   ========================================================================== */
export const AdminMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<AdminMentorDetail[]>([]);
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [commissionVal, setCommissionVal] = useState<number>(15);
  const { toast } = useToast();

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      const [mentorData, segmentData] = await Promise.all([
        AdminService.getAllMentors(),
        SegmentService.getAllSegments(true),
      ]);
      setMentors(mentorData);
      setSegments(segmentData);
      setLoading(false);
    }
    loadMentors();
  }, []);

  const handleUpdateTier = async (mentorId: string, tier: 'Standard' | 'Verified Pro' | 'Top Rated') => {
    const updated = await AdminService.updateMentorTier(mentorId, tier);
    if (updated) {
      setMentors((prev) => prev.map((m) => (m.id === mentorId ? updated : m)));
      toast({
        title: 'Tier Updated',
        description: `Mentor tier adjusted to ${tier}.`,
      });
    }
  };

  const handleUpdateSegment = async (mentorId: string, segmentId: string) => {
    const success = await AdminService.updateMentorSegment(mentorId, segmentId);
    if (success) {
      setMentors((prev) =>
        prev.map((m) => {
          if (m.id === mentorId) {
            return {
              ...m,
              segment_id: segmentId,
              verified_categories: [segmentId],
            };
          }
          return m;
        })
      );
      const segName = segments.find((s) => s.id === segmentId || s.slug === segmentId)?.name || segmentId;
      toast({
        title: 'Specialist Domain Assigned',
        description: `Assigned specialist to ${segName} advisory segment.`,
      });
    }
  };

  const handleSaveCommission = async (mentorId: string) => {
    const updated = await AdminService.updateMentorCommission(mentorId, commissionVal);
    if (updated) {
      setMentors((prev) => prev.map((m) => (m.id === mentorId ? updated : m)));
      setEditingCommissionId(null);
      toast({
        title: 'Commission Overridden',
        description: `Platform fee adjusted to ${commissionVal}% for this specialist.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Specialist Roster & Commission Overrides</h1>
        <p className="text-sm text-[#9a9a9a]">
          Manage credential status, advisory segment mapping, tier assignments, and custom commission take-rates per specialist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => {
          const activeSegment = segments.find(
            (s) => s.id === mentor.segment_id || s.slug === (mentor.verified_categories?.[0] || '')
          );

          return (
            <div
              key={mentor.id}
              className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={mentor.profile.avatar_url}
                      alt={mentor.profile.full_name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <h3 className="text-base font-medium text-white">{mentor.profile.full_name}</h3>
                      <p className="text-xs text-[#9a9a9a] line-clamp-1">{mentor.headline}</p>
                    </div>
                  </div>
                </div>

                {/* Status & Tier & Segment Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={`text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border ${
                      mentor.verification_status === 'approved'
                        ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                        : 'text-[#ffb829] border-[#ffb829]/30 bg-[#ffb829]/10'
                    }`}
                  >
                    {mentor.verification_status}
                  </span>

                  <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full text-[#8052ff] border border-[#8052ff]/30 bg-[#8052ff]/10">
                    {mentor.tier}
                  </span>

                  {activeSegment && (
                    <span
                      className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: activeSegment.accent,
                        borderColor: `${activeSegment.accent}40`,
                        backgroundColor: `${activeSegment.accent}15`,
                      }}
                    >
                      {activeSegment.name}
                    </span>
                  )}
                </div>

                {/* Segment Assignment Dropdown */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] uppercase text-[#707070] font-semibold block">
                    Assigned Advisory Domain:
                  </label>
                  <select
                    value={mentor.segment_id || mentor.verified_categories?.[0] || 'relationship'}
                    onChange={(e) => handleUpdateSegment(mentor.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  >
                    {segments.map((seg) => (
                      <option key={seg.id} value={seg.slug || seg.id}>
                        {seg.name} {seg.is_active ? '' : '(Archived)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stats Table */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-white/[0.01] p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] uppercase text-[#9a9a9a] block">Gross Earned</span>
                    <span className="font-semibold text-white">₹{(mentor.total_revenue_inr || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#9a9a9a] block">Completed Calls</span>
                    <span className="font-semibold text-white">{mentor.completed_sessions} Sessions</span>
                  </div>
                </div>

                {/* Commission Override Control */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9a9a9a]">Platform Fee:</span>
                    {editingCommissionId === mentor.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={commissionVal}
                          onChange={(e) => setCommissionVal(Number(e.target.value))}
                          className="w-14 p-1 rounded bg-white/10 text-white text-xs text-center border border-white/20"
                        />
                        <span className="text-white">%</span>
                        <button
                          onClick={() => handleSaveCommission(mentor.id)}
                          className="p-1 rounded bg-[#15846e] text-white hover:bg-[#12705e]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{mentor.commission_percent}%</span>
                        <button
                          onClick={() => {
                            setEditingCommissionId(mentor.id);
                            setCommissionVal(mentor.commission_percent);
                          }}
                          className="text-[#8052ff] hover:underline text-[11px]"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <select
                  value={mentor.tier}
                  onChange={(e) => handleUpdateTier(mentor.id, e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                >
                  <option value="Standard">Standard Tier</option>
                  <option value="Verified Pro">Verified Pro</option>
                  <option value="Top Rated">Top Rated</option>
                </select>

                <Link
                  to={`/advisors/${mentor.id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-xs text-[#bdbdbd] hover:text-white"
                >
                  Public Profile ↗
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ==========================================================================
   4. ADMIN VERIFICATION QUEUE PAGE
   ========================================================================== */
export const AdminVerificationPage: React.FC = () => {
  const [requests, setRequests] = useState<MentorVerificationRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<MentorVerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      const data = await VerificationService.getAllRequests();
      setRequests(data);
      setLoading(false);
    }
    loadRequests();
  }, []);

  const handleApprove = async (req: MentorVerificationRequest) => {
    const res = await VerificationService.approveRequest(req.id, 'Platform Operator');
    if (res) {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? res : r)));
      toast({
        title: 'Verification Approved',
        description: `${req.mentor_name} has been certified and granted publish permissions.`,
      });
      setSelectedReq(null);
    }
  };

  const handleReject = async (req: MentorVerificationRequest) => {
    const reason = prompt('Enter rejection notes for mentor:');
    if (reason === null) return;
    const res = await VerificationService.rejectRequest(req.id, reason || 'Incomplete credential proof', 'Platform Operator');
    if (res) {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? res : r)));
      toast({
        title: 'Verification Rejected',
        description: 'Notice delivered to mentor.',
      });
      setSelectedReq(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Credential Verification Audit</h1>
        <p className="text-sm text-[#9a9a9a]">
          Mandatory certification checks for regulated domains (Psychology, Legal Counsel, Financial Advisory) before offerings can be published.
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-medium text-white">{req.mentor_name}</h3>
                <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-[#8052ff]/10 text-[#8052ff] border border-[#8052ff]/20">
                  {req.category_name}
                </span>
                <span
                  className={`text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border ${
                    req.status === 'approved'
                      ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                      : req.status === 'rejected'
                      ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                      : 'text-[#ffb829] border-[#ffb829]/30 bg-[#ffb829]/10'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#bdbdbd]">
                <div>
                  <span className="text-[#9a9a9a]">Board / Registry:</span> {req.licensing_board}
                </div>
                <div>
                  <span className="text-[#9a9a9a]">License #:</span> <span className="font-mono text-white">{req.license_number}</span>
                </div>
              </div>

              {req.rejection_reason && (
                <p className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  Rejection Reason: {req.rejection_reason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {req.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleApprove(req)}
                    className="px-5 py-2.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#15846e]/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Credentials</span>
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    className="px-5 py-2.5 rounded-full border border-white/15 hover:bg-white/10 text-[#9a9a9a] hover:text-white text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <span>Reject</span>
                  </button>
                </>
              ) : (
                <span className="text-xs text-[#9a9a9a]">
                  Audited by {req.reviewed_by} on{' '}
                  {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   5. ADMIN BOOKINGS & ATOMIC CONCURRENCY LEDGER PAGE
   ========================================================================== */
export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      const data = await AdminService.getAllGlobalBookings();
      setBookings(data);
      setLoading(false);
    }
    loadBookings();
  }, []);

  const handleForceComplete = async (booking: EnrichedBooking) => {
    await BookingService.updateBookingStatus(booking.id, 'completed');
    await PaymentService.releaseEscrow({
      bookingId: booking.id,
      mentorId: booking.mentor_id,
      seekerId: booking.seeker_id,
      amountInr: booking.amount_inr,
    });
    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'completed' } : b))
    );
    toast({
      title: 'Escrow Released',
      description: `Disbursement of ₹${(booking.mentor_payout_inr || 0).toLocaleString()} issued to mentor.`,
    });
  };

  const handleForceRefund = async (booking: EnrichedBooking) => {
    await BookingService.updateBookingStatus(booking.id, 'cancelled');
    await PaymentService.refundPayment({
      bookingId: booking.id,
      mentorId: booking.mentor_id,
      seekerId: booking.seeker_id,
      amountInr: booking.amount_inr,
      reason: 'Admin Dispute Settlement',
    });
    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
    );
    toast({
      title: 'Refund Processed',
      description: `Full refund of ₹${(booking.amount_inr || 0).toLocaleString()} returned to seeker wallet.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Atomic Booking Ledger</h1>
        <p className="text-sm text-[#9a9a9a]">
          Global immutable transaction log with escrow status tracking and conflict auditing.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[#9a9a9a] uppercase tracking-wider font-medium">
              <tr>
                <th className="p-4 pl-6">Booking Ref</th>
                <th className="p-4">Offering</th>
                <th className="p-4">Specialist & Seeker</th>
                <th className="p-4">Scheduled Slot</th>
                <th className="p-4">Escrow Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 pl-6 font-mono text-[#8052ff] font-medium">{booking.id}</td>
                  <td className="p-4 font-medium text-white max-w-[200px] truncate">{booking.gig.title}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{booking.mentor.full_name}</div>
                    <div className="text-[11px] text-[#9a9a9a]">
                      Seeker: {booking.is_anonymous ? 'Pseudonym Protected' : booking.seeker_name}
                    </div>
                  </td>
                  <td className="p-4 text-[#bdbdbd]">
                    {new Date(booking.start_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-semibold text-white">₹{(booking.amount_inr || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`uppercase text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        booking.status === 'confirmed'
                          ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                          : booking.status === 'completed'
                          ? 'text-[#8052ff] border-[#8052ff]/30 bg-[#8052ff]/10'
                          : 'text-[#9a9a9a] border-white/10 bg-white/5'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {booking.status === 'confirmed' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleForceComplete(booking)}
                          className="px-2.5 py-1 rounded bg-[#15846e]/20 text-[#15846e] hover:bg-[#15846e]/30 border border-[#15846e]/30 text-[10px] font-semibold uppercase"
                        >
                          Release Escrow
                        </button>
                        <button
                          onClick={() => handleForceRefund(booking)}
                          className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-[10px] font-semibold uppercase"
                        >
                          Refund
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   6. ADMIN REPORTS & FINANCIAL LEDGER PAGE
   ========================================================================== */
export const AdminReportsPage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadReports() {
      const [dsp, ldg] = await Promise.all([
        AdminService.getAllDisputes(),
        PaymentService.getLedger(),
      ]);
      setDisputes(dsp);
      setLedger(ldg);
    }
    loadReports();
  }, []);

  const handleResolveDispute = async (resolution: 'refund_seeker' | 'payout_mentor' | 'split_50_50') => {
    if (!selectedDispute) return;
    const updated = await AdminService.resolveDispute({
      disputeId: selectedDispute.id,
      resolution,
      notes: resolutionNotes || 'Arbitrated per platform policy',
      auditorName: 'Platform Operator',
    });
    if (updated) {
      setDisputes((prev) => prev.map((d) => (d.id === selectedDispute.id ? updated : d)));
      setSelectedDispute(null);
      setResolutionNotes('');
      toast({
        title: 'Dispute Settled',
        description: `Resolution applied: ${resolution.replace('_', ' ')}. Escrow balanced.`,
      });
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,ID,Type,Amount_INR,Booking_ID,Timestamp\n' +
      ledger.map((l) => `${l.id},${l.type},${l.amount_inr},${l.booking_id || ''},${l.created_at}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SuggestKey_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Generated', description: 'Financial ledger downloaded as CSV.' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-normal text-white">Dispute Moderation & Financial Ledger</h1>
          <p className="text-sm text-[#9a9a9a]">Escrow arbitration, incident review, and double-entry transaction audits.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Open Disputes Section */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#ffb829]" />
          <span>Active Escrow Disputes</span>
        </h2>

        {disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.01] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-white">Ticket #{d.id}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {d.issue_category}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                        d.status === 'resolved'
                          ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                          : 'text-[#ffb829] border-[#ffb829]/30 bg-[#ffb829]/10'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">₹{(d.amount_inr || 0).toLocaleString()} Escrow</span>
                </div>

                <p className="text-xs text-[#bdbdbd] bg-black/40 p-3 rounded-xl border border-white/5">
                  "{d.statement}"
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#9a9a9a] pt-1">
                  <div>
                    Seeker: {d.seeker_name} • Advisor: {d.mentor_name} • Booking: {d.booking_id}
                  </div>

                  {d.status !== 'resolved' ? (
                    <button
                      onClick={() => setSelectedDispute(d)}
                      className="px-4 py-1.5 rounded-full bg-[#ffb829] hover:bg-[#e6a524] text-black text-xs font-semibold uppercase tracking-wider self-end"
                    >
                      Arbitrate Case
                    </button>
                  ) : (
                    <span className="text-[#15846e] font-semibold">Resolved ({d.resolution})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#9a9a9a]">No disputes recorded.</div>
        )}
      </div>

      {/* Dispute Arbitration Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/15 rounded-[28px] p-6 max-w-lg w-full space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold">Arbitrate Dispute #{selectedDispute.id}</h3>
              <button onClick={() => setSelectedDispute(null)} className="text-[#9a9a9a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9a9a9a]">
              Client statement: "{selectedDispute.statement}"
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-[#9a9a9a]">Arbitration Finding Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter summary reason for this determination..."
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleResolveDispute('refund_seeker')}
                className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[11px] font-semibold uppercase text-center hover:bg-rose-500/20"
              >
                100% Refund Seeker
              </button>
              <button
                onClick={() => handleResolveDispute('split_50_50')}
                className="p-2.5 rounded-xl border border-[#ffb829]/30 bg-[#ffb829]/10 text-[#ffb829] text-[11px] font-semibold uppercase text-center hover:bg-[#ffb829]/20"
              >
                Split 50/50
              </button>
              <button
                onClick={() => handleResolveDispute('payout_mentor')}
                className="p-2.5 rounded-xl border border-[#15846e]/30 bg-[#15846e]/10 text-[#15846e] text-[11px] font-semibold uppercase text-center hover:bg-[#15846e]/20"
              >
                Release to Mentor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Double-Entry Ledger */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] font-medium text-white text-sm">
          Platform Double-Entry Ledger Logs
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-[#9a9a9a] uppercase tracking-wider font-medium">
              <tr>
                <th className="p-3 pl-6">Tx ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Booking Ref</th>
                <th className="p-3 pr-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.01]">
                  <td className="p-3 pl-6 text-[#9a9a9a]">{tx.id}</td>
                  <td className="p-3 font-sans font-semibold">
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                        tx.type === 'ESCROW_HOLD'
                          ? 'text-[#ffb829] bg-[#ffb829]/10'
                          : tx.type === 'ESCROW_RELEASE'
                          ? 'text-[#15846e] bg-[#15846e]/10'
                          : tx.type === 'PLATFORM_COMMISSION'
                          ? 'text-[#8052ff] bg-[#8052ff]/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-3 text-white">₹{(tx.amount_inr || 0).toLocaleString()}</td>
                  <td className="p-3 text-[#9a9a9a]">{tx.booking_id || '—'}</td>
                  <td className="p-3 pr-6 text-[#9a9a9a] text-[11px]">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   7. ADMIN SETTINGS & TAXONOMIES PAGE
   ========================================================================== */
export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_fee_percent: 15,
    escrow_hold_hours: 24,
    require_mental_health_audit: true,
    require_financial_audit: true,
    payment_gateway_mode: 'sandbox',
    razorpay_key_id: 'rzp_test_SuggestKeyPlatform2026',
    auto_payout_enabled: true,
    max_session_duration_minutes: 90,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      const data = await AdminService.getSettings();
      setSettings(data);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await AdminService.updateSettings(settings);
    setSettings(res);
    setSaving(false);
    toast({
      title: 'Platform Parameters Saved',
      description: 'System configurations and verification constraints have been updated.',
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Platform Settings & Verification Rules</h1>
        <p className="text-sm text-[#9a9a9a]">
          Configure default platform commission percentages, escrow hold durations, and strict regulatory enforcement policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <h3 className="text-base font-medium text-white pb-3 border-b border-white/5">
            Fee & Escrow Structure
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Default Platform Take-Rate (%)</label>
              <input
                type="number"
                min="5"
                max="40"
                value={settings.platform_fee_percent}
                onChange={(e) => setSettings({ ...settings, platform_fee_percent: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Escrow Holding Window (Hours)</label>
              <input
                type="number"
                min="1"
                max="72"
                value={settings.escrow_hold_hours}
                onChange={(e) => setSettings({ ...settings, escrow_hold_hours: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <h3 className="text-base font-medium text-white pb-3 border-b border-white/5">
            Mandatory Verification Rules (Database Enforced)
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-white">Mental Health Professional Verification</div>
                <div className="text-[11px] text-[#9a9a9a]">
                  Blocks all bookings for mental-health offerings if mentor verification status is not Approved.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.require_mental_health_audit}
                onChange={(e) => setSettings({ ...settings, require_mental_health_audit: e.target.checked })}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-white">Financial & Wealth Licensing Audit</div>
                <div className="text-[11px] text-[#9a9a9a]">
                  Requires SEBI / CFA / Series 65 accreditation proof before listing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.require_financial_audit}
                onChange={(e) => setSettings({ ...settings, require_financial_audit: e.target.checked })}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <h3 className="text-base font-medium text-white pb-3 border-b border-white/5">
            Payment Gateway Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Gateway Environment</label>
              <select
                value={settings.payment_gateway_mode}
                onChange={(e) => setSettings({ ...settings, payment_gateway_mode: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              >
                <option value="sandbox">Sandbox (Simulated Escrow Ledger)</option>
                <option value="live">Live Production (Razorpay Direct)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Razorpay Key ID</label>
              <input
                type="text"
                value={settings.razorpay_key_id}
                onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#8052ff]/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Applying...' : 'Save System Parameters'}</span>
        </button>
      </form>
    </div>
  );
};

/* ==========================================================================
   8. ADMIN ADVISORY SEGMENTS MANAGEMENT (DATABASE SOURCE OF TRUTH)
   ========================================================================== */
export const AdminSegmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [segments, setSegments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');
  const [formAccent, setFormAccent] = useState('#8052ff');
  const [formUseCases, setFormUseCases] = useState('');
  const [formAudience, setFormAudience] = useState('Seekers & Professionals');
  const [formAdvisorTypes, setFormAdvisorTypes] = useState('Audited Specialists');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const { SegmentService } = await import('../../domains/segment/SegmentService');
      const [allSegs, metrics] = await Promise.all([
        SegmentService.getAllSegments(true),
        AdminService.getSegmentAnalytics(),
      ]);
      setSegments(allSegs);
      setAnalytics(metrics);
    } catch (err) {
      console.error('Failed to load segments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSegment(null);
    setFormName('');
    setFormSlug('');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormIcon('Sparkles');
    setFormAccent('#8052ff');
    setFormUseCases('Strategy & roadmaps\nCritical inflection points\n1:1 Structured guidance');
    setFormAudience('Seekers & Professionals');
    setFormAdvisorTypes('Audited Domain Specialists');
    setFormIsActive(true);
    setFormOrder(segments.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (seg: any) => {
    setEditingSegment(seg);
    setFormName(seg.name || '');
    setFormSlug(seg.slug || '');
    setFormShortDesc(seg.short_description || seg.description || '');
    setFormFullDesc(seg.description || '');
    setFormIcon(seg.icon || 'Sparkles');
    setFormAccent(seg.accent || '#8052ff');
    const cases = Array.isArray(seg.use_cases) ? seg.use_cases.join('\n') : (seg.use_cases || '');
    setFormUseCases(cases);
    setFormAudience(seg.audience || 'Seekers & Professionals');
    setFormAdvisorTypes(seg.advisor_types || 'Audited Specialists');
    setFormIsActive(seg.is_active !== undefined ? seg.is_active : true);
    setFormOrder(seg.display_order || 1);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingSegment) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(generatedSlug);
    }
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { SegmentService } = await import('../../domains/segment/SegmentService');
      const useCasesArray = formUseCases
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingSegment) {
        // Update existing segment
        await SegmentService.updateSegment(editingSegment.id || editingSegment.slug, {
          name: formName.trim(),
          slug: formSlug.trim(),
          short_description: formShortDesc.trim(),
          description: formFullDesc.trim() || formShortDesc.trim(),
          icon: formIcon,
          accent: formAccent,
          use_cases: useCasesArray,
          audience: formAudience.trim(),
          advisor_types: formAdvisorTypes.trim(),
          is_active: formIsActive,
          display_order: Number(formOrder),
        });
        toast({
          title: 'Segment Updated',
          description: `Segment "${formName}" updated successfully in database.`,
        });
      } else {
        // Create new segment
        await SegmentService.createSegment({
          name: formName.trim(),
          slug: formSlug.trim(),
          short_description: formShortDesc.trim(),
          description: formFullDesc.trim() || formShortDesc.trim(),
          icon: formIcon,
          accent: formAccent,
          use_cases: useCasesArray,
          audience: formAudience.trim(),
          advisor_types: formAdvisorTypes.trim(),
          is_active: formIsActive,
          display_order: Number(formOrder),
        });
        toast({
          title: 'Segment Created',
          description: `New segment "${formName}" created and live in database.`,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err?.message || 'Failed to save advisory segment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (seg: any) => {
    try {
      const { SegmentService } = await import('../../domains/segment/SegmentService');
      const updated = await SegmentService.toggleSegmentActive(seg.id || seg.slug);
      if (updated) {
        toast({
          title: 'Status Updated',
          description: `Segment ${seg.name} is now ${updated.is_active ? 'Active' : 'Inactive'}`,
        });
        await loadData();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to toggle segment state',
        variant: 'destructive',
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= segments.length) return;

    const newOrder = [...segments];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    const orderedIds = newOrder.map((s) => s.id);
    const { SegmentService } = await import('../../domains/segment/SegmentService');
    await SegmentService.reorderSegments(orderedIds);
    await loadData();
    toast({
      title: 'Order Updated',
      description: 'Display sequence updated',
    });
  };

  const handleDeleteSegment = async (seg: any) => {
    if (!confirm(`Are you sure you want to delete segment "${seg.name}"? If mentors exist, it will prevent deletion.`)) {
      return;
    }

    try {
      const { SegmentService } = await import('../../domains/segment/SegmentService');
      const res = await SegmentService.deleteSegment(seg.id || seg.slug);
      if (res.success) {
        toast({
          title: 'Segment Deleted',
          description: `Segment "${seg.name}" deleted.`,
        });
        await loadData();
      } else {
        toast({
          title: 'Cannot Delete',
          description: res.error || 'Cannot delete segment.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const totalSegments = segments.length;
  const activeSegments = segments.filter((s) => s.is_active).length;
  const totalAdvisors = analytics.reduce((acc, curr) => acc + (curr.advisor_count || 0), 0);
  const totalGmv = analytics.reduce((acc, curr) => acc + (curr.total_gmv_inr || 0), 0);

  const PRESET_ICONS = [
    'Heart', 'Briefcase', 'Brain', 'Sparkles', 'Coins', 'Compass',
    'Scale', 'GraduationCap', 'Activity', 'Shield', 'Users', 'TrendingUp',
    'Building', 'Award', 'Lightbulb', 'Stethoscope'
  ];

  const PRESET_ACCENTS = [
    '#ffb829', '#8052ff', '#15846e', '#3b82f6', '#ec4899', '#f97316', '#06b6d4', '#10b981'
  ];

  return (
    <div className="space-y-8">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-[#8052ff] px-2 py-0.5 rounded-full bg-[#8052ff]/10 border border-[#8052ff]/20">
              Database Source of Truth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
            Advisory Segments Manager
          </h1>
          <p className="text-xs text-[#9a9a9a]">
            Create, configure, reorder, and govern platform advisory pillars. Changes reflect instantly across seeker switchers, introductions, and carousels.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20 shrink-0"
        >
          <Layers className="w-4 h-4" />
          <span>Add Advisory Domain</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">Total Domains</span>
          <p className="text-xl font-medium text-white">{totalSegments}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#15846e]">Active In Discovery</span>
          <p className="text-xl font-medium text-[#15846e]">{activeSegments}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">Audited Mentors</span>
          <p className="text-xl font-medium text-white">{totalAdvisors}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-[#ffb829]">Aggregated GMV</span>
          <p className="text-xl font-medium text-[#ffb829]">₹{totalGmv.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Segments Live Table & Ordering */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.015] overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white uppercase tracking-wider">
            Active & Seeded Domains ({segments.length})
          </h2>
          <span className="text-xs text-[#707070]">
            Sequence governs Seeker horizontal tab ordering
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#9a9a9a]">
            Loading advisory segments from database...
          </div>
        ) : segments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-[#bdbdbd]">No advisory segments defined in database.</p>
            <button
              onClick={openCreateModal}
              className="text-xs text-[#8052ff] hover:underline uppercase tracking-wider"
            >
              + Create your first domain
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {segments.map((seg, idx) => {
              const segAnalytics = analytics.find(
                (a) => a.segment.id === seg.id || a.segment.slug === seg.slug
              );
              const accent = seg.accent || '#8052ff';

              return (
                <div
                  key={seg.id || seg.slug}
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    seg.is_active ? 'hover:bg-white/[0.02]' : 'opacity-60 bg-white/[0.005]'
                  }`}
                >
                  {/* Left: Reorder controls + Icon & Identity */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="w-6 h-6 rounded border border-white/10 flex items-center justify-center text-xs text-[#9a9a9a] hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ▲
                      </button>
                      <span className="text-[10px] font-mono text-[#707070]">{idx + 1}</span>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === segments.length - 1}
                        title="Move Down"
                        className="w-6 h-6 rounded border border-white/10 flex items-center justify-center text-xs text-[#9a9a9a] hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ▼
                      </button>
                    </div>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                      style={{
                        backgroundColor: `${accent}15`,
                        color: accent,
                      }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{seg.name}</span>
                        <span className="text-[10px] font-mono text-[#707070]">/{seg.slug}</span>
                        <span
                          className="text-[9px] uppercase font-semibold px-2 py-0.2 rounded-full border"
                          style={{
                            borderColor: `${accent}40`,
                            color: accent,
                            backgroundColor: `${accent}10`,
                          }}
                        >
                          {seg.advisor_types || 'Audited'}
                        </span>
                        {seg.is_active ? (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#15846e]/20 text-[#15846e] border border-[#15846e]/30">
                            Live
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9a9a9a] line-clamp-1 max-w-xl">
                        {seg.short_description || seg.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#707070]">
                        <span>Audience: <strong className="text-[#bdbdbd]">{seg.audience}</strong></span>
                        <span>•</span>
                        <span>Use Cases: <strong className="text-[#bdbdbd]">{(seg.use_cases || []).length}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Action Buttons */}
                  <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-right hidden sm:block pr-2">
                      <p className="text-xs font-semibold text-white">
                        {segAnalytics?.advisor_count || 0} Advisors
                      </p>
                      <p className="text-[11px] text-[#707070]">
                        ₹{(segAnalytics?.total_gmv_inr || 0).toLocaleString('en-IN')} GMV
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(seg)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors border ${
                          seg.is_active
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-[#15846e]/40 text-[#15846e] hover:bg-[#15846e]/10'
                        }`}
                      >
                        {seg.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => openEditModal(seg)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        title="Edit Segment"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSegment(seg)}
                        className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/15 transition-colors"
                        title="Delete Segment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d0d10] border border-white/15 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <h3 className="text-lg font-normal text-white">
                  {editingSegment ? `Edit Segment: ${editingSegment.name}` : 'Create New Advisory Domain'}
                </h3>
                <p className="text-xs text-[#8e8e93]">
                  Configure schema fields, educational introductions, and visual accents.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-[#9a9a9a] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSegment} className="space-y-5">
              {/* Row 1: Name + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    Segment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Financial & Wealth"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    URL Slug * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. financial-wealth"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-[#666] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              </div>

              {/* Row 2: Short Description / Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                  Short Description / Overview *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="Explains what this advisory domain covers in 1-2 crisp sentences..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Row 3: Full Educational Description */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                  Detailed Domain Context & Mission
                </label>
                <textarea
                  rows={2}
                  value={formFullDesc}
                  onChange={(e) => setFormFullDesc(e.target.value)}
                  placeholder="Detailed explanation of advisor qualifications, methodologies, and focus..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Row 4: Icon & Accent Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    Domain Icon
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  >
                    {PRESET_ICONS.map((ic) => (
                      <option key={ic} value={ic} className="bg-[#1a1a20]">
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formAccent}
                      onChange={(e) => setFormAccent(e.target.value)}
                      className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto py-1">
                      {PRESET_ACCENTS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setFormAccent(hex)}
                          className="w-6 h-6 rounded-full border border-white/20 shrink-0 transition-transform hover:scale-110"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Use Cases / Topics (One per line) */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium flex items-center justify-between">
                  <span>What this domain helps with (One per line)</span>
                  <span className="text-[10px] text-[#707070]">Renders as educational bullet points</span>
                </label>
                <textarea
                  rows={3}
                  value={formUseCases}
                  onChange={(e) => setFormUseCases(e.target.value)}
                  placeholder="e.g.&#10;Recurring bottlenecks & crisis resolution&#10;Strategic decision-making & leverage&#10;Promotion dossiers & compensation"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-[#666] focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Row 6: Target Audience & Advisor Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    placeholder="e.g. Founders • Executives • Couples"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    Advisor Credentials Badge
                  </label>
                  <input
                    type="text"
                    value={formAdvisorTypes}
                    onChange={(e) => setFormAdvisorTypes(e.target.value)}
                    placeholder="e.g. LMFT & Gottman Audited"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              </div>

              {/* Row 7: Active Toggle & Display Order */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#8052ff]"
                  />
                  <span>Active & Visible to Seekers</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9a9a9a]">Display Sequence:</span>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#8052ff]/20 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : editingSegment ? 'Save Changes' : 'Create Segment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

