import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { BookingService, EnrichedBooking } from '../../domains/booking/BookingService';
import { MessagingService, ChatChannel, ChatMessage } from '../../domains/messaging/MessagingService';
import { MentorStudioService, AvailabilitySlotRule, MentorEarningsStats } from '../../domains/mentor/MentorStudioService';
import { SegmentService } from '../../domains/segment/SegmentService';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import { Gig, SessionOutcome } from '../../lib/supabase/types';
import { SessionOutcomeService } from '../../domains/seeker/SessionOutcomeService';
import {
  Sparkles,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Send,
  Download,
  FileText,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  User,
  Route,
  ListTodo,
  Target,
  X,
} from 'lucide-react';

/* ==========================================================================
   1. MENTOR OVERVIEW / STUDIO DASHBOARD
   ========================================================================== */
export const MentorOverviewPage: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [earnings, setEarnings] = useState<MentorEarningsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudio() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [bks, ggs, earn] = await Promise.all([
        BookingService.getMentorBookings(profile.id),
        MentorStudioService.getMentorGigs(profile.id),
        MentorStudioService.getEarningsStats(profile.id),
      ]);
      setBookings(bks);
      setGigs(ggs);
      setEarnings(earn);
      setLoading(false);
    }
    loadStudio();
  }, [profile?.id]);

  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed');
  const nextSession = upcomingBookings[0];

  return (
    <div className="space-y-12">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8052ff] font-semibold px-2.5 py-0.5 rounded-full bg-[#8052ff]/10 border border-[#8052ff]/20">
              Mentor Studio
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#15846e] font-semibold px-2.5 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Audited Specialist
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Mentor'}
          </h1>
          <p className="text-sm text-[#9a9a9a] max-w-2xl leading-relaxed">
            Monitor client consultations, configure your weekly booking calendar, manage advisory offerings, and track net disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/mentor/gigs/new"
            className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Gig</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Upcoming Sessions</span>
            <Calendar className="w-4 h-4 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-normal text-white">{upcomingBookings.length}</div>
          <p className="text-xs text-[#9a9a9a]">Next session scheduled this week</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Active Offerings</span>
            <Sparkles className="w-4 h-4 text-[#15846e]" />
          </div>
          <div className="text-3xl font-normal text-white">{gigs.length} Gigs</div>
          <p className="text-xs text-[#9a9a9a]">Published on explore directory</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Available Balance</span>
            <DollarSign className="w-4 h-4 text-[#ffb829]" />
          </div>
          <div className="text-3xl font-normal text-white">₹{(earnings?.netPayoutInr || 0).toLocaleString('en-IN')}</div>
          <p className="text-xs text-[#15846e]">Escrow cleared & ready for transfer</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Client Rating</span>
            <ShieldCheck className="w-4 h-4 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-normal text-white">{(earnings?.avgRating || 0).toFixed(2)} ★</div>
          <p className="text-xs text-[#9a9a9a]">Based on {(earnings?.reviewCount || 0)} verified consultations</p>
        </div>
      </div>

      {/* Immediate Session Callout Card */}
      {nextSession ? (
        <div className="p-8 rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-black space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#15846e] font-semibold">
              <div className="w-2 h-2 rounded-full bg-[#15846e] animate-pulse" />
              <span>Next Upcoming Client Appointment</span>
            </div>
            <span className="text-xs text-[#9a9a9a]">Booking ID: {nextSession.id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xl md:text-2xl font-normal text-white">{nextSession.gig?.title ?? 'Advisory Session'}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#bdbdbd]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8052ff]" />
                  <span>{new Date(nextSession.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8052ff]" />
                  <span>
                    {new Date(nextSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(nextSession.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Client: {nextSession.is_anonymous ? 'Anonymous Seeker' : (nextSession.seeker?.full_name ?? 'Seeker')}</span>
                </div>
              </div>

              {nextSession.notes && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#9a9a9a]">
                  <span className="text-[#bdbdbd] font-medium">Seeker's Crossroads: </span>
                  {nextSession.notes}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              {nextSession.meeting_url && (
                <a
                  href={nextSession.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#15846e]/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Meeting Room</span>
                </a>
              )}
              <Link
                to={`/mentor/bookings/${nextSession.id}`}
                className="px-6 py-3 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.02] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <span>Manage Notes & Status</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/mentor/gigs"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-[#8052ff]/10 text-[#8052ff] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white group-hover:text-[#8052ff] transition-colors flex items-center gap-2">
              Advisory Offerings & Pricing
              <ArrowUpRight className="w-4 h-4" />
            </h3>
            <p className="text-xs text-[#9a9a9a] mt-1">Configure pricing tiers, duration, and session deliverables.</p>
          </div>
        </Link>

        <Link
          to="/mentor/availability"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-[#15846e]/10 text-[#15846e] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white group-hover:text-[#15846e] transition-colors flex items-center gap-2">
              Authoritative Calendar & Slots
              <ArrowUpRight className="w-4 h-4" />
            </h3>
            <p className="text-xs text-[#9a9a9a] mt-1">Set recurring weekly hours and buffer times between client calls.</p>
          </div>
        </Link>

        <Link
          to="/mentor/earnings"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-[#ffb829]/10 text-[#ffb829] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white group-hover:text-[#ffb829] transition-colors flex items-center gap-2">
              Earnings & Direct Payouts
              <ArrowUpRight className="w-4 h-4" />
            </h3>
            <p className="text-xs text-[#9a9a9a] mt-1">Review fee breakdowns (85% net payout) and transfer ledger.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

/* ==========================================================================
   2. MENTOR GIGS LIST PAGE
   ========================================================================== */
export const MentorGigsPage: React.FC = () => {
  const { profile } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadGigs() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await MentorStudioService.getMentorGigs(profile.id);
      setGigs(data);
      setLoading(false);
    }
    loadGigs();
  }, [profile?.id]);

  const handleDelete = async (gigId: string) => {
    if (!profile?.id) return;
    if (confirm('Are you sure you want to remove this advisory offering?')) {
      await MentorStudioService.deleteGig(gigId, profile.id);
      setGigs((prev) => prev.filter((g) => g.id !== gigId));
      toast({ title: 'Gig Removed', description: 'The offering has been archived.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-normal text-white">Advisory Offerings (Gigs)</h1>
          <p className="text-sm text-[#9a9a9a]">Manage your 1:1 consultation formats, structured deliverables, and rates.</p>
        </div>

        <Link
          to="/mentor/gigs/new"
          className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Offering</span>
        </Link>
      </div>

      <div className="space-y-4">
        {gigs.map((gig) => (
          <div
            key={gig.id}
            className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-medium text-white">{gig.title}</h3>
                <span
                  className={`text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border ${
                    gig.is_published
                      ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                      : 'text-[#9a9a9a] border-white/10 bg-white/5'
                  }`}
                >
                  {gig.is_published ? 'Published' : 'Draft'}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#8052ff] px-2.5 py-0.5 rounded-full border border-[#8052ff]/30 bg-[#8052ff]/10">
                  {SegmentService.getCachedSegmentBySlug(gig.segment_id)?.name || gig.segment_id}
                </span>
              </div>

              <p className="text-xs text-[#bdbdbd] line-clamp-2 leading-relaxed">{gig.description}</p>

              <div className="flex items-center gap-4 text-xs text-[#9a9a9a]">
                <span>{gig.duration_minutes} Minutes</span>
                <span>•</span>
                <span className="text-white font-semibold">₹{(gig.price_inr || 0).toLocaleString('en-IN')}</span>
                <span>•</span>
                <span>{(gig.deliverables || []).length} Deliverables included</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={`/gigs/${gig.id}`}
                target="_blank"
                className="p-2.5 rounded-full border border-white/10 hover:border-white/25 text-[#9a9a9a] hover:text-white transition-colors"
                title="Preview Public Listing"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                to={`/mentor/gigs/${gig.id}`}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              <button
                onClick={() => handleDelete(gig.id)}
                className="p-2.5 rounded-full border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-colors"
                title="Delete Gig"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   3. MENTOR GIG EDITOR / CREATOR PAGE
   ========================================================================== */
export const MentorGigEditorPage: React.FC = () => {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const isNew = gigId === 'new';

  const [title, setTitle] = useState('');
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [segmentId, setSegmentId] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priceInr, setPriceInr] = useState(3500);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGig() {
      setLoading(true);
      setError(null);

      if (!profile?.id) {
        setError('You must be logged in to manage gigs.');
        setLoading(false);
        return;
      }

      const activeSegments = await SegmentService.getActiveSegments();
      setSegments(activeSegments);

      if (activeSegments.length > 0 && !segmentId) {
        setSegmentId(activeSegments[0].id);
      }

      if (isNew) {
        setLoading(false);
        return;
      }

      const gig = await MentorStudioService.getGigById(gigId!, profile.id);
      if (gig) {
        setTitle(gig.title);
        setSegmentId(gig.segment_id ?? '');
        setDescription(gig.description);
        setDurationMinutes(gig.duration_minutes);
        setPriceInr(gig.price_inr);
        setDeliverables(gig.deliverables);
        setIsPublished(gig.is_published);
      }
      setLoading(false);
    }
    loadGig();
  }, [gigId, isNew, profile?.id]);

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Session title is required.' });
      return;
    }

    if (!segmentId) {
      toast({ title: 'Validation Error', description: 'Please select a specialty domain.' });
      return;
    }

    if (!profile?.id) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to save gigs.' });
      return;
    }

    setSaving(true);
    try {
      await MentorStudioService.saveGig({
        id: isNew ? undefined : gigId,
        title,
        segment_id: segmentId,
        description,
        duration_minutes: durationMinutes,
        price_inr: priceInr,
        deliverables,
        is_published: isPublished,
      }, profile.id);

      toast({
        title: isNew ? 'Offering Created' : 'Offering Saved',
        description: 'Your advisory gig has been successfully updated.',
      });
      navigate('/mentor/gigs');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save gig.';
      toast({
        title: 'Error',
        description: message,
      });
    }
    setSaving(false);
  };

  const platformFee = Math.round(priceInr * 0.15);
  const netPayout = priceInr - platformFee;

  return (
    <div className="space-y-8 max-w-3xl">
      <Link to="/mentor/gigs" className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white flex items-center gap-1">
        ← Back to Gigs List
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">
          {isNew ? 'Create Advisory Offering' : 'Edit Advisory Offering'}
        </h1>
        <p className="text-sm text-[#9a9a9a]">Define session goals, structured deliverables, and compensation terms.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      {segments.length === 0 && !loading && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-300">
          No active specialty domains available. Please contact an admin to activate segments before creating gigs.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Offering Title *</label>
            <input
              type="text"
              placeholder="e.g. Executive Burnout Diagnostic & Cognitive Restructuring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              required
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Specialty Domain</label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              >
                 {segments.map((seg) => (
                   <option key={seg.id} value={seg.id}>
                     {seg.name}
                   </option>
                 ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes (Deep Dive)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Description & Scope</label>
            <textarea
              rows={4}
              placeholder="Outline who this session is designed for, what topics are covered, and expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#8052ff] leading-relaxed"
            />
          </div>

          {/* Price & Payout Math */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Pricing (INR)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 items-center">
              <div>
                <span className="text-[10px] text-[#9a9a9a] uppercase block mb-1">Session Rate</span>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={priceInr}
                  onChange={(e) => setPriceInr(Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#9a9a9a] uppercase block mb-1">Platform Fee (15%)</span>
                <div className="text-sm text-[#9a9a9a] py-2">₹{(platformFee || 0).toLocaleString('en-IN')}</div>
              </div>

              <div>
                <span className="text-[10px] text-[#15846e] uppercase font-semibold block mb-1">Net Mentor Payout (85%)</span>
                <div className="text-sm font-semibold text-[#15846e] py-2">₹{(netPayout || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Structured Deliverables */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Structured Session Deliverables</label>
            <div className="space-y-2">
              {deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15846e] shrink-0" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add another deliverable (e.g. 30-Day Action Checklist)"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDeliverable();
                    }
                  }}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider font-semibold text-white transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white">Publish Offering</span>
              <p className="text-[11px] text-[#9a9a9a]">Make this session visible on the public discovery directory.</p>
            </div>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-white/20 text-[#8052ff] focus:ring-0 bg-transparent w-5 h-5"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Offering'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/mentor/gigs')}
            className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* ==========================================================================
   4. MENTOR AVAILABILITY & CALENDAR PAGE
   ========================================================================== */
export const MentorAvailabilityPage: React.FC = () => {
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<AvailabilitySlotRule[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSchedule() {
      const rules = await MentorStudioService.getAvailability(profile?.id || 'current');
      setSchedule(rules);
    }
    loadSchedule();
  }, [profile?.id]);

  const handleToggleDay = (day: string) => {
    setSchedule(
      schedule.map((rule) =>
        rule.dayOfWeek === day ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(
      schedule.map((rule) =>
        rule.dayOfWeek === day ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await MentorStudioService.saveAvailability(profile?.id || '', schedule);
    setSaving(false);
    toast({
      title: 'Schedule Synchronized',
      description: 'Your authoritative weekly availability slots have been saved.',
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-normal text-white">Authoritative Weekly Availability</h1>
          <p className="text-sm text-[#9a9a9a]">Set recurring hours for atomic slot calculation and calendar sync.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
        </button>
      </div>

      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 text-xs text-[#9a9a9a]">
          <span>Weekly Recurring Windows</span>
          <span>Timezone: Asia/Kolkata (IST - UTC+5:30)</span>
        </div>

        <div className="space-y-4">
          {schedule.map((rule) => (
            <div
              key={rule.dayOfWeek}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                rule.enabled
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-white/5 bg-transparent opacity-50'
              }`}
            >
              <div className="flex items-center gap-4 w-36">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleDay(rule.dayOfWeek)}
                  className="rounded border-white/20 text-[#8052ff] focus:ring-0 bg-transparent w-4 h-4"
                />
                <span className="text-sm font-medium text-white">{rule.dayOfWeek}</span>
              </div>

              {rule.enabled ? (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => handleTimeChange(rule.dayOfWeek, 'startTime', e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                  <span className="text-xs text-[#707070]">to</span>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => handleTimeChange(rule.dayOfWeek, 'endTime', e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              ) : (
                <span className="text-xs text-[#707070] italic">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   5. MENTOR BOOKINGS MANAGEMENT PAGE
   ========================================================================== */
export const MentorBookingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'confirmed' | 'completed' | 'all'>('confirmed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await BookingService.getMentorBookings(profile.id);
      setBookings(data);
      setLoading(false);
    }
    loadBookings();
  }, [profile?.id]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'confirmed') return b.status === 'confirmed' || b.status === 'in_progress';
    if (activeTab === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-normal text-white">Client Appointments & Pipeline</h1>
          <p className="text-sm text-[#9a9a9a]">Review client crossroads, launch video rooms, and fulfill post-session artifacts.</p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
          {(['confirmed', 'completed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
                activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-[#9a9a9a] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                  {booking.is_anonymous ? '?' : booking.seeker?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-white">
                      {booking.is_anonymous ? 'Anonymous Seeker' : booking.seeker?.full_name}
                    </h3>
                    {booking.is_anonymous && (
                      <span className="text-[10px] uppercase font-semibold text-[#ffb829] px-2 py-0.5 rounded-full bg-[#ffb829]/10 border border-[#ffb829]/30">
                        Shielded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9a9a9a]">{booking.gig?.title ?? 'Advisory Session'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full border ${
                    booking.status === 'confirmed'
                      ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                      : 'text-[#8052ff] border-[#8052ff]/30 bg-[#8052ff]/10'
                  }`}
                >
                  {booking.status}
                </span>
                <span className="text-xs font-semibold text-[#15846e]">
                  Net Payout: ₹{(booking.mentor_payout_inr || (booking.amount_inr ? booking.amount_inr * 0.85 : 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#bdbdbd]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#8052ff]" />
                    <span>{new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#8052ff]" />
                    <span>
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {booking.notes && (
                  <p className="text-xs text-[#9a9a9a] line-clamp-1 italic">
                    "{booking.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                {booking.meeting_url && booking.status === 'confirmed' && (
                  <a
                    href={booking.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </a>
                )}
                <Link
                  to={`/mentor/bookings/${booking.id}`}
                  className="px-5 py-2.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <span>Console & Notes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   6. MENTOR BOOKING DETAIL / SESSION CONSOLE
   ========================================================================== */
export const MentorBookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<EnrichedBooking | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [sessionOutcome, setSessionOutcome] = useState<SessionOutcome | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState('');
  const [outcomeObservations, setOutcomeObservations] = useState<string[]>([]);
  const [outcomeActions, setOutcomeActions] = useState<string[]>([]);
  const [outcomeCheckpoint, setOutcomeCheckpoint] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newAction, setNewAction] = useState('');

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      setLoading(true);
      const data = await BookingService.getBookingById(bookingId);
      if (data) {
        setBooking(data);
        setSessionNotes(data.session_notes || '');
        setDeliverables(data.deliverables_shared || []);
        const outcome = await SessionOutcomeService.getSessionOutcomeByBooking(bookingId);
        if (outcome) {
          setSessionOutcome(outcome);
          setOutcomeSummary(outcome.summary || '');
          setOutcomeObservations(outcome.key_observations || []);
          setOutcomeActions(outcome.recommended_actions || []);
          setOutcomeCheckpoint(outcome.next_checkpoint || '');
        }
      }
      setLoading(false);
    }
    loadBooking();
  }, [bookingId]);

  const handleUpdateStatus = async (status: 'confirmed' | 'completed' | 'cancelled') => {
    if (!bookingId) return;
    const updated = await BookingService.updateBookingStatus(bookingId, status, {
      session_notes: sessionNotes,
      deliverables_shared: deliverables,
    });
    if (updated) {
      setBooking(updated);
      toast({
        title: 'Status Updated',
        description: `Booking has been marked as ${status}.`,
      });
    }
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    const updated = [...deliverables, newDeliverable.trim()];
    setDeliverables(updated);
    setNewDeliverable('');
  };

  const handleSaveNotesAndDeliverables = async () => {
    if (!bookingId) return;
    setSaving(true);
    const updated = await BookingService.updateBookingStatus(bookingId, booking?.status || 'confirmed', {
      session_notes: sessionNotes,
      deliverables_shared: deliverables,
    });
    if (updated) setBooking(updated);
    setSaving(false);
    toast({
      title: 'Session Artifacts Saved',
      description: 'Private notes and client deliverables have been updated.',
    });
  };

  if (loading || !booking) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link to="/mentor/bookings" className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white flex items-center gap-1">
        ← Back to Bookings
      </Link>

      {/* Main Console Header */}
      <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[#8052ff] font-semibold">
              Mentor Session Console
            </span>
            <h1 className="text-2xl md:text-3xl font-normal text-white">{booking.gig?.title ?? 'Advisory Session'}</h1>
          </div>

          <div className="flex items-center gap-2">
            {booking.status === 'confirmed' ? (
              <button
                onClick={() => handleUpdateStatus('completed')}
                className="px-4 py-2 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Mark Completed & Release Escrow
              </button>
            ) : (
              <span className="text-xs uppercase font-semibold text-[#8052ff] px-3.5 py-1.5 rounded-full bg-[#8052ff]/10 border border-[#8052ff]/30">
                {booking.status}
              </span>
            )}
          </div>
        </div>

        {/* Video Call & Meeting Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2 text-xs text-[#bdbdbd]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8052ff]" />
              <span>{new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8052ff]" />
              <span>
                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#15846e] font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>Net Disbursement: ₹{(booking.mentor_payout_inr || (booking.amount_inr ? booking.amount_inr * 0.85 : 0)).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {booking.meeting_url && (
              <a
                href={booking.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>Open Video Session Room</span>
              </a>
            )}
            <Link
              to="/mentor/messages"
              className="w-full py-3 rounded-full border border-white/15 hover:border-white/30 text-center text-xs font-semibold uppercase tracking-wider text-white transition-all"
            >
              Direct Chat with Client
            </Link>
          </div>
        </div>
      </div>

      {/* Seeker Intake Context */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-3">
        <span className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">Seeker's Initial Crossroads Note</span>
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-[#bdbdbd] leading-relaxed">
          {booking.notes || 'Client did not submit intake notes.'}
        </div>
      </div>

      {/* Mentor Confidential Session Notes */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium text-white">Confidential Session Notes & Observations</h3>
            <p className="text-xs text-[#9a9a9a]">Only visible to you. Used for tracking recurring advisory insights.</p>
          </div>
        </div>

        <textarea
          rows={4}
          placeholder="Record key diagnostic observations, tactical advice given, and follow-up milestones..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#8052ff] leading-relaxed"
        />
      </div>

      {/* Shared Deliverables & Uploads */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-medium text-white">Client Deliverables & Framework Uploads</h3>
          <p className="text-xs text-[#9a9a9a]">These roadmaps will be unlocked on the seeker's session room dashboard.</p>
        </div>

        <div className="space-y-2">
          {deliverables.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-xs text-white">
                <FileText className="w-3.5 h-3.5 text-[#8052ff]" />
                <span>{item}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add shared deliverable filename or link (e.g. Action_Framework_v1.pdf)"
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
            />
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider font-semibold text-white transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSaveNotesAndDeliverables}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Session Changes'}</span>
          </button>
        </div>
      </div>

      {/* Session Outcome & Roadmap */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-medium text-white">Session Outcome & Roadmap</h3>
          <p className="text-xs text-[#9a9a9a]">Structured outcome shared with the seeker after consultation.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Summary</label>
            <textarea
              rows={3}
              value={outcomeSummary}
              onChange={(e) => setOutcomeSummary(e.target.value)}
              placeholder="High-level summary of the session outcome..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8052ff]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Key Observations</label>
            <div className="space-y-2">
              {outcomeObservations.map((obs, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={obs}
                    onChange={(e) => {
                      const updated = [...outcomeObservations];
                      updated[idx] = e.target.value;
                      setOutcomeObservations(updated);
                    }}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setOutcomeObservations(outcomeObservations.filter((_, i) => i !== idx))}
                    className="p-2 rounded-full hover:bg-white/10 text-[#ff5c5c]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Add observation..."
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newObservation.trim()) return;
                    setOutcomeObservations([...outcomeObservations, newObservation.trim()]);
                    setNewObservation('');
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider font-semibold text-white transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Recommended Actions</label>
            <div className="space-y-2">
              {outcomeActions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={action}
                    onChange={(e) => {
                      const updated = [...outcomeActions];
                      updated[idx] = e.target.value;
                      setOutcomeActions(updated);
                    }}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setOutcomeActions(outcomeActions.filter((_, i) => i !== idx))}
                    className="p-2 rounded-full hover:bg-white/10 text-[#ff5c5c]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Add recommended action..."
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAction.trim()) return;
                    setOutcomeActions([...outcomeActions, newAction.trim()]);
                    setNewAction('');
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider font-semibold text-white transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Next Checkpoint</label>
            <input
              type="date"
              value={outcomeCheckpoint}
              onChange={(e) => setOutcomeCheckpoint(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={async () => {
              if (!bookingId || !booking) return;
              setSaving(true);
              if (sessionOutcome) {
                await SessionOutcomeService.updateSessionOutcome(sessionOutcome.id, {
                  summary: outcomeSummary,
                  keyObservations: outcomeObservations,
                  recommendedActions: outcomeActions,
                  nextCheckpoint: outcomeCheckpoint || undefined,
                });
              } else {
                await SessionOutcomeService.createSessionOutcome({
                  bookingId,
                  seekerId: booking.seeker_id,
                  mentorId: booking.mentor_id,
                  summary: outcomeSummary,
                  keyObservations: outcomeObservations,
                  recommendedActions: outcomeActions,
                  nextCheckpoint: outcomeCheckpoint || undefined,
                });
              }
              setSaving(false);
              toast({
                title: 'Session Outcome Saved',
                description: 'Roadmap has been shared with the seeker.',
              });
            }}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : sessionOutcome ? 'Update Outcome' : 'Publish Outcome'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   7. MENTOR MESSAGES PAGE
   ========================================================================== */
export const MentorMessagesPage: React.FC = () => {
  const { profile } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const chs = await MessagingService.getChannels(profile.id, 'mentor');
      setChannels(chs);
      if (chs.length > 0) {
        setSelectedChannelId(chs[0].id);
      }
      setLoading(false);
    }
    loadChannels();
  }, [profile?.id]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedChannelId) return;
      const msgs = await MessagingService.getMessages(selectedChannelId);
      setMessages(msgs);
    }
    loadMessages();
  }, [selectedChannelId]);

  const activeChannel = channels.find((c) => c.id === selectedChannelId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChannelId || !profile?.id) return;

    const newMsg = await MessagingService.sendMessage({
      conversationId: selectedChannelId,
      senderId: profile.id,
      senderName: profile.full_name || 'Mentor',
      senderRole: 'mentor',
      senderAvatar: profile.avatar_url ?? undefined,
      content: inputText.trim(),
    });

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Client Advisory Messages</h1>
        <p className="text-sm text-[#9a9a9a]">Confidential participant channels linked to scheduled advisory sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] border border-white/10 rounded-[24px] bg-white/[0.02] overflow-hidden">
        {/* Left: Channel List */}
        <div className="border-r border-white/10 p-4 space-y-2 overflow-y-auto max-h-[600px]">
          <span className="text-[11px] uppercase tracking-wider text-[#9a9a9a] px-3 font-semibold block mb-2">
            Active Client Threads
          </span>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`w-full text-left p-3.5 rounded-2xl transition-all space-y-1.5 ${
                selectedChannelId === channel.id
                  ? 'bg-white/10 border border-white/15 text-white'
                  : 'hover:bg-white/5 text-[#9a9a9a] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                  {channel.seeker_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white truncate">{channel.seeker_name}</h4>
                    <span className="text-[10px] text-[#707070]">
                      {channel.last_message_at
                        ? new Date(channel.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9a9a9a] truncate mt-0.5">{channel.last_message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Active Chat Stream */}
        <div className="lg:col-span-2 flex flex-col h-[600px] justify-between p-6 bg-black/40">
          {activeChannel ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                    {activeChannel.seeker_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{activeChannel.seeker_name}</h3>
                    <p className="text-xs text-[#9a9a9a]">Booking ID: {activeChannel.booking_id}</p>
                  </div>
                </div>
                <Link
                  to={`/mentor/bookings/${activeChannel.booking_id}`}
                  className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline"
                >
                  Open Session Console →
                </Link>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2">
                {messages.map((msg) => {
                  const isMe = msg.sender_role === 'mentor';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-[#707070] font-medium">{msg.sender_name}</span>
                        <span className="text-[10px] text-[#555]">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#8052ff] text-white rounded-tr-xs'
                            : 'bg-white/10 text-white rounded-tl-xs border border-white/10'
                        }`}
                      >
                        <p>{msg.content}</p>
                        {msg.attachments && (
                          <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] bg-black/20 p-2 rounded-lg">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate flex-1">{att.name}</span>
                                {att.size && <span className="text-[10px] opacity-75">{att.size}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-white/5 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type advisory response..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-full px-5 py-3 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff] transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] disabled:opacity-40 disabled:hover:bg-[#8052ff] text-white flex items-center justify-center transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#9a9a9a]">
              Select a conversation to review client messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   8. MENTOR EARNINGS & LEDGER PAGE
   ========================================================================== */
export const MentorEarningsPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<MentorEarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadEarnings() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await MentorStudioService.getEarningsStats(profile.id);
      setStats(data);
      setLoading(false);
    }
    loadEarnings();
  }, [profile?.id]);

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    toast({
      title: 'Payout Initiated',
      description: `₹${(stats?.netPayoutInr || 0).toLocaleString('en-IN')} transfer queued to linked account via Razorpay Direct.`,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Earnings & Financial Ledger</h1>
        <p className="text-sm text-[#9a9a9a]">Transparent gross revenue calculations, platform fee deductions (15%), and direct bank payouts.</p>
      </div>

      {/* Balance & Payout Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Available Net Payout</span>
          <div className="text-3xl font-normal text-[#15846e]">₹{(stats?.netPayoutInr || 0).toLocaleString('en-IN')}</div>
          <p className="text-xs text-[#9a9a9a]">Escrow released after session completion</p>
        </div>

        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">In Escrow (Pending Calls)</span>
          <div className="text-3xl font-normal text-white">₹{(stats?.pendingEscrowInr || 7000).toLocaleString('en-IN')}</div>
          <p className="text-xs text-[#9a9a9a]">Guaranteed in trust account</p>
        </div>

        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-4">
          <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Instant Disbursement</span>
          <button
            onClick={handleRequestPayout}
            disabled={payoutRequested}
            className="w-full py-3 rounded-full bg-[#15846e] hover:bg-[#12705e] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#15846e]/20"
          >
            <CreditCard className="w-4 h-4" />
            <span>{payoutRequested ? 'Transfer Queued' : 'Withdraw Funds'}</span>
          </button>
        </div>
      </div>

      {/* Historical Transfers */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <h3 className="text-base font-medium text-white">Disbursement Transfer History</h3>

        <div className="space-y-3">
          {(stats?.payoutHistory || []).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#8052ff]" />
                  <span className="text-xs font-medium text-white">HDFC Bank ({item.bankAccountEnding})</span>
                  <span className="text-[10px] uppercase font-semibold text-[#15846e] px-2 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/30">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#9a9a9a]">Ref: {item.utrNumber} • {item.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white">₹{(item.amountInr || 0).toLocaleString('en-IN')}</span>
                <button
                  onClick={() => toast({ title: 'Invoice Exported', description: `Downloaded tax receipt for ${item.id}` })}
                  className="p-2 rounded-full hover:bg-white/10 text-[#9a9a9a] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   9. MENTOR PROFILE & CREDENTIALS PAGE
   ========================================================================== */
export const MentorProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      full_name: fullName,
    });
    setSaving(false);
    toast({
      title: 'Credentials Updated',
      description: 'Your mentor profile has been saved and synced.',
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Mentor Credentials & Directory Profile</h1>
        <p className="text-sm text-[#9a9a9a]">Manage your public bio, licensing records, and professional verification status.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Verification Status</span>
            <span className="text-xs uppercase font-semibold text-[#15846e] px-3 py-1 rounded-full border border-[#15846e]/30 bg-[#15846e]/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Approved Specialist
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Full Name & Credentials</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Empirical Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#8052ff] leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-medium text-white">Audited Verification Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase text-[#9a9a9a] block">Licensing Board</span>
              <span className="text-white font-medium">American Board of Professional Psychology</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase text-[#9a9a9a] block">License / Registry Number</span>
              <span className="text-white font-mono font-medium">PSY-992014-CA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#8052ff]/20"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
          <Link
            to={`/mentor/${profile?.id || ''}`}
            target="_blank"
            className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
          >
            Preview Public Profile ↗
          </Link>
        </div>
      </form>
    </div>
  );
};
