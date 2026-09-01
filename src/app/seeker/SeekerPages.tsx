import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { BookingService, EnrichedBooking } from '../../domains/booking/BookingService';
import { MessagingService, ChatChannel, ChatMessage } from '../../domains/messaging/MessagingService';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { ReviewService, ReviewDetail } from '../../domains/reviews/ReviewService';
import { AdminService } from '../../domains/admin/AdminService';
import { BookingCheckoutModal } from '../../components/booking/BookingCheckoutModal';
import { PaginatedAdvisorCarousel } from '../../components/advisor/PaginatedAdvisorCarousel';
import { SegmentIntroduction } from '../../components/segment/SegmentIntroduction';
import { SegmentService } from '../../domains/segment/SegmentService';
import { Gig } from '../../lib/supabase/types';
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Send,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  User,
  EyeOff,
  Bell,
  Check,
  ChevronRight,
  Star,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';

/* ==========================================================================
   1. SEEKER WORKSPACE (DASHBOARD)
   ========================================================================== */
export const SeekerWorkspacePage: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutAdvisor, setCheckoutAdvisor] = useState<AdvisorDetail | null>(null);
  const [checkoutGig, setCheckoutGig] = useState<Gig | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [bks, chs] = await Promise.all([
        BookingService.getSeekerBookings(profile?.id),
        MessagingService.getChannels(profile?.id || 'usr-seeker-01', 'seeker'),
      ]);
      setBookings(bks);
      setChannels(chs);
      setLoading(false);
    }
    loadDashboard();
  }, [profile?.id]);

  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed');
  const nextBooking = upcomingBookings[0];

  const handleBookSession = (advisor: AdvisorDetail, gig: Gig) => {
    setCheckoutAdvisor(advisor);
    setCheckoutGig(gig);
  };

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8052ff] font-semibold px-2.5 py-0.5 rounded-full bg-[#8052ff]/10 border border-[#8052ff]/20">
              Personal Advisory Suite
            </span>
            {profile?.is_anonymous_enabled && (
              <span className="text-[11px] uppercase tracking-widest text-[#ffb829] font-medium px-2.5 py-0.5 rounded-full bg-[#ffb829]/10 border border-[#ffb829]/20 flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Anonymous Mode
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Seeker'}
          </h1>
          <p className="text-sm text-[#9a9a9a] max-w-2xl leading-relaxed">
            Manage your scheduled advisory consultations, coordinate directly with credentialed mentors, and review structured post-session roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seeker/discover"
            className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#8052ff]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Advisors</span>
          </Link>
        </div>
      </div>

      {/* Next Upcoming Session Focus Card */}
      {nextBooking ? (
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-black p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#15846e] font-semibold">
                <div className="w-2 h-2 rounded-full bg-[#15846e] animate-pulse" />
                <span>Next Scheduled Session</span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-white">
                {nextBooking.mentor.segment_name || nextBooking.mentor.segment_id || 'Advisory'}
              </span>
            </div>
            <span className="text-xs text-[#9a9a9a]">Booking ID: {nextBooking.id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xl md:text-2xl font-normal text-white">
                {nextBooking.gig.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#bdbdbd]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8052ff]" />
                  <span>{new Date(nextBooking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8052ff]" />
                  <span>
                    {new Date(nextBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(nextBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={nextBooking.mentor.avatar_url}
                    alt={nextBooking.mentor.full_name}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                  <span>with {nextBooking.mentor.full_name}</span>
                </div>
              </div>

              {nextBooking.notes && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[#9a9a9a] line-clamp-2">
                  <span className="text-[#bdbdbd] font-medium">Session Goal: </span>
                  {nextBooking.notes}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              {nextBooking.meeting_url && (
                <a
                  href={nextBooking.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#15846e]/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Video Call</span>
                </a>
              )}
              <Link
                to={`/seeker/bookings/${nextBooking.id}`}
                className="px-6 py-3 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.02] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <span>View Session Room</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] text-center space-y-4">
          <p className="text-base text-[#bdbdbd]">You do not have any upcoming advisory sessions scheduled.</p>
          <Link
            to="/seeker/discover"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Book Your First Advisory Session</span>
          </Link>
        </div>
      )}

      {/* Metrics & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/seeker/bookings"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Active Bookings</span>
            <Calendar className="w-5 h-5 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-normal text-white">{upcomingBookings.length}</div>
          <p className="text-xs text-[#9a9a9a] group-hover:text-white transition-colors flex items-center gap-1">
            <span>Manage sessions & notes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        <Link
          to="/seeker/messages"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Direct Channels</span>
            <MessageSquare className="w-5 h-5 text-[#15846e]" />
          </div>
          <div className="text-3xl font-normal text-white">{channels.length}</div>
          <p className="text-xs text-[#9a9a9a] group-hover:text-white transition-colors flex items-center gap-1">
            <span>Participant encrypted chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        <Link
          to="/seeker/profile"
          className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#9a9a9a]">Privacy Shield</span>
            <ShieldCheck className="w-5 h-5 text-[#ffb829]" />
          </div>
          <div className="text-base font-medium text-white">
            {profile?.is_anonymous_enabled ? 'Anonymous Shield Active' : 'Real Identity Mode'}
          </div>
          <p className="text-xs text-[#9a9a9a] group-hover:text-white transition-colors flex items-center gap-1">
            <span>Configure anonymity settings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>

      {/* Featured Advisors for Quick Intent Match (Paginated Horizontal Carousel: 2 visible cards on desktop) */}
      <PaginatedAdvisorCarousel
        segment="all"
        title="Vetted Mentors in Your Network"
        subtitle="Empirically audited specialists with verified professional credentials across all advisory domains."
        badge="Audited Specialists"
        viewAllLink="/seeker/discover"
        onBookSession={handleBookSession}
      />

      {/* Direct Booking Modal */}
      {checkoutAdvisor && checkoutGig && (
        <BookingCheckoutModal
          advisor={checkoutAdvisor}
          gig={checkoutGig}
          isOpen={true}
          onClose={() => {
            setCheckoutAdvisor(null);
            setCheckoutGig(null);
          }}
        />
      )}
    </div>
  );
};

/* ==========================================================================
   2. SEEKER DISCOVER PAGE
   ========================================================================== */
export const SeekerDiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const segmentParam = searchParams.get('segment') || 'all';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(segmentParam);
  const [checkoutAdvisor, setCheckoutAdvisor] = useState<AdvisorDetail | null>(null);
  const [checkoutGig, setCheckoutGig] = useState<Gig | null>(null);
  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    SegmentService.getActiveSegments().then((list) => {
      if (isMounted) setSegments(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedCategory(segmentParam);
  }, [segmentParam]);

  const categories = [
    { id: 'all', label: 'All Domains' },
    ...segments.map((s) => ({ id: s.slug, label: s.name })),
  ];

  const currentSegment = segments.find(
    (s) => s.slug === selectedCategory || s.id === selectedCategory
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ segment: categoryId });
    }
  };

  const handleBookSession = (advisor: AdvisorDetail, gig: Gig) => {
    setCheckoutAdvisor(advisor);
    setCheckoutGig(gig);
  };

  return (
    <div className="space-y-10">
      {/* 1. Dynamic Segment Introduction & Educational Context */}
      <SegmentIntroduction
        segment={currentSegment || selectedCategory}
        showTransitionBanner={true}
      />

      {/* 2. Advisor Discovery Controls (Search & Segment Category Tabs) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9a9a9a] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${selectedCategory === 'all' ? 'all advisors' : (currentSegment?.name || selectedCategory) + ' specialists'} by topic, skill, or name...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#707070] hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-all ${
                  selectedCategory === c.id
                    ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                    : 'text-[#9a9a9a] hover:text-white border border-white/5 hover:bg-white/5'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Paginated Carousel Discovery Layout */}
      {selectedCategory === 'all' ? (
        <div className="space-y-12">
          {segments.map((seg) => (
            <PaginatedAdvisorCarousel
              key={seg.id}
              segment={seg.slug}
              searchQuery={search}
              title={`${seg.name} Advisory Specialists`}
              subtitle={seg.short_description || `Verified specialists in ${seg.name}.`}
              badge={seg.advisor_types || 'Verified Specialists'}
              viewAllLink={`/seeker/discover?segment=${seg.slug}`}
              onBookSession={handleBookSession}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active Segment Main Paginated Carousel ONLY — Strict Single-Segment Isolation */}
          <PaginatedAdvisorCarousel
            key={selectedCategory}
            segment={selectedCategory}
            searchQuery={search}
            title={`Featured ${currentSegment?.name || selectedCategory} Specialists`}
            subtitle={currentSegment?.short_description || `Top rated mentors verified in ${currentSegment?.name || selectedCategory}.`}
            badge={currentSegment?.advisor_types || 'Verified Domain Specialists'}
            onBookSession={handleBookSession}
          />
        </div>
      )}

      {/* Direct Booking Modal */}
      {checkoutAdvisor && checkoutGig && (
        <BookingCheckoutModal
          advisor={checkoutAdvisor}
          gig={checkoutGig}
          isOpen={true}
          onClose={() => {
            setCheckoutAdvisor(null);
            setCheckoutGig(null);
          }}
        />
      )}
    </div>
  );
};

/* ==========================================================================
   3. SEEKER BOOKINGS LIST PAGE
   ========================================================================== */
export const SeekerBookingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      const data = await BookingService.getSeekerBookings(profile?.id);
      setBookings(data);
      setLoading(false);
    }
    loadBookings();
  }, [profile?.id]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'confirmed' || b.status === 'in_progress';
    if (activeTab === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-normal text-white">My Advisory Bookings</h1>
          <p className="text-sm text-[#9a9a9a]">Manage session appointments, meeting links, and post-call deliverables.</p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
          {(['upcoming', 'completed', 'all'] as const).map((tab) => (
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

      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const segId = booking.mentor?.segment_id || booking.gig?.segment_id || '';
            const seg = SegmentService.getCachedSegmentBySlug(segId);
            const segLabel = seg?.name || segId || 'Advisory';
            const segAccent = seg?.accent || '#8052ff';

            return (
              <div
                key={booking.id}
                className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <img
                      src={booking.mentor.avatar_url}
                      alt={booking.mentor.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-medium text-white">{booking.mentor.full_name}</h3>
                        <span
                          className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: segAccent,
                            borderColor: `${segAccent}40`,
                            backgroundColor: `${segAccent}15`,
                          }}
                        >
                          {segLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#9a9a9a]">{booking.mentor.headline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full border ${
                        booking.status === 'confirmed'
                          ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                          : booking.status === 'completed'
                          ? 'text-[#8052ff] border-[#8052ff]/30 bg-[#8052ff]/10'
                          : 'text-[#9a9a9a] border-white/10 bg-white/5'
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xs text-[#9a9a9a]">₹{(booking.amount_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="text-lg font-normal text-white">{booking.gig.title}</h4>
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
                        <span>Join Call</span>
                      </a>
                    )}
                    <Link
                      to={`/seeker/bookings/${booking.id}`}
                      className="px-5 py-2.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <span>Session Room</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-[24px] border border-dashed border-white/10 text-center space-y-3">
          <p className="text-sm text-[#bdbdbd]">No {activeTab} bookings found.</p>
          <Link to="/seeker/discover" className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline">
            Explore Advisors & Schedule a Session →
          </Link>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   4. SEEKER BOOKING DETAIL / SESSION ROOM
   ========================================================================== */
export const SeekerBookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { profile } = useAuth();
  const [booking, setBooking] = useState<EnrichedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Review states
  const [reviews, setReviews] = useState<ReviewDetail[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [expertiseRating, setExpertiseRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [actionRating, setActionRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymousReview, setIsAnonymousReview] = useState(profile?.is_anonymous_enabled || false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute states
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<'no_show' | 'quality_unmet' | 'unprofessional' | 'technical_failure'>('quality_unmet');
  const [disputeStatement, setDisputeStatement] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    async function loadBookingAndReviews() {
      if (!bookingId) return;
      setLoading(true);
      const data = await BookingService.getBookingById(bookingId);
      setBooking(data);
      if (data) {
        const revs = await ReviewService.getReviewsForMentor(data.mentor.id);
        setReviews(revs);
      }
      setLoading(false);
    }
    loadBookingAndReviews();
  }, [bookingId]);

  const existingReview = booking ? reviews.find((r) => r.booking_id === booking.id) : undefined;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !profile) return;
    setSubmittingReview(true);

    try {
      const newRev = await ReviewService.submitReview({
        bookingId: booking.id,
        seekerId: profile.id,
        seekerName: profile.full_name || 'Alex Rivera',
        seekerAvatar: profile.avatar_url,
        isAnonymous: isAnonymousReview,
        mentorId: booking.mentor.id,
        gigId: booking.gig.id,
        rating,
        ratingExpertise: expertiseRating,
        ratingCommunication: commRating,
        ratingActionability: actionRating,
        reviewText,
      });

      setReviews((prev) => [newRev, ...prev]);
      setShowReviewModal(false);
      toast({
        title: 'Review Verified & Published',
        description: 'Thank you for your empirical feedback on this advisory session.',
      });
    } catch (err: any) {
      toast({
        title: 'Review Error',
        description: err.message || 'Could not submit review.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !profile || !disputeStatement.trim()) return;
    setSubmittingDispute(true);

    try {
      await AdminService.createDispute({
        bookingId: booking.id,
        seekerId: profile.id,
        seekerName: profile.full_name || 'Verified Seeker',
        mentorId: booking.mentor.id,
        mentorName: booking.mentor.profile?.full_name || 'Advisor',
        amountInr: booking.price_inr,
        issueCategory: 'quality_dispute',
        statement: disputeStatement.trim(),
      });

      setShowDisputeModal(false);
      setDisputeStatement('');
      toast({
        title: 'Dispute Case Opened',
        description: 'Escrow release is held. An admin compliance officer has been notified.',
      });
    } catch (err: any) {
      toast({
        title: 'Dispute Error',
        description: err.message || 'Could not register dispute.',
      });
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-10 rounded-[24px] border border-white/10 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#ffb829] mx-auto" />
        <h2 className="text-lg font-medium text-white">Booking Not Found</h2>
        <p className="text-xs text-[#9a9a9a]">We could not locate this session in your booking ledger.</p>
        <Link to="/seeker/bookings" className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline inline-block">
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/seeker/bookings"
          className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white flex items-center gap-1"
        >
          ← Back to All Bookings
        </Link>
        <button
          onClick={() => setShowDisputeModal(true)}
          className="text-xs text-[#ff5c5c] hover:underline flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Session Issue / Escrow Freeze</span>
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[#8052ff] font-semibold">
              Confirmed Session Room
            </span>
            <h1 className="text-2xl md:text-3xl font-normal text-white">{booking.gig.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase font-semibold tracking-wider px-3.5 py-1.5 rounded-full border ${
                booking.status === 'confirmed'
                  ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                  : booking.status === 'completed'
                  ? 'text-[#8052ff] border-[#8052ff]/30 bg-[#8052ff]/10'
                  : 'text-[#ffb829] border-[#ffb829]/30 bg-[#ffb829]/10'
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {/* Meeting Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-[#bdbdbd]">
              <Calendar className="w-4 h-4 text-[#8052ff]" />
              <span>{new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#bdbdbd]">
              <Clock className="w-4 h-4 text-[#8052ff]" />
              <span>
                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (45 min)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#bdbdbd]">
              <ShieldCheck className="w-4 h-4 text-[#15846e]" />
              <span>Protected by Suggest Key Escrow Guarantee (₹{(booking.amount_inr || 0).toLocaleString('en-IN')})</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {booking.meeting_url && (
              <a
                href={booking.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#15846e]/20"
              >
                <Video className="w-4 h-4" />
                <span>Launch Video Meeting</span>
              </a>
            )}
            <Link
              to="/seeker/messages"
              className="w-full py-3.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Advisor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mentor Information & Seeker Intake Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
          <span className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">Assigned Advisor</span>
          <div className="flex items-start gap-4">
            <img
              src={booking.mentor.avatar_url}
              alt={booking.mentor.full_name}
              className="w-12 h-12 rounded-full object-cover border border-white/10"
            />
            <div className="space-y-1">
              <h3 className="text-base font-medium text-white">{booking.mentor.full_name}</h3>
              <p className="text-xs text-[#9a9a9a] leading-snug">{booking.mentor.headline}</p>
              <Link
                to={`/advisors/${booking.mentor.id}`}
                className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline inline-block pt-1"
              >
                View Full Audit Profile →
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-3">
          <span className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">Your Session Context</span>
          <p className="text-xs text-[#bdbdbd] leading-relaxed">
            {booking.notes || 'No custom preparation notes provided.'}
          </p>
          <div className="pt-2 text-[11px] text-[#9a9a9a] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15846e]" />
            <span>Shared confidentially with advisor prior to call</span>
          </div>
        </div>
      </div>

      {/* Post-Session Deliverables & Roadmaps */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-white">Post-Session Deliverables & Summary</h3>
            <p className="text-xs text-[#9a9a9a]">Artifacts, frameworks, and action roadmaps uploaded by your mentor.</p>
          </div>
        </div>

        {booking.deliverables_shared && booking.deliverables_shared.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {booking.deliverables_shared.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-[#8052ff] shrink-0" />
                  <span className="text-xs text-white truncate">{item}</span>
                </div>
                <button
                  onClick={() => toast({ title: 'Download Started', description: `Retrieving ${item}` })}
                  className="p-2 rounded-full hover:bg-white/10 text-[#9a9a9a] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#9a9a9a]">
            Deliverables will be unlocked and uploaded here by {booking.mentor.full_name} upon session conclusion.
          </div>
        )}
      </div>

      {/* Verified Review System */}
      <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white">Verified Advisory Feedback</h3>
              <span className="text-[10px] uppercase tracking-wider text-[#15846e] px-2 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/30">
                Verified Seeker
              </span>
            </div>
            <p className="text-xs text-[#9a9a9a]">
              Post-consultation feedback is tied to atomic escrow ledger records to ensure authentic ratings.
            </p>
          </div>

          {!existingReview && booking.status === 'completed' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Leave Feedback</span>
            </button>
          )}
        </div>

        {existingReview ? (
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#ffb829]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < existingReview.rating ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-white">
                  {existingReview.is_anonymous ? 'Submitted via Privacy Shield' : existingReview.seeker_name}
                </span>
              </div>
              <span className="text-[11px] text-[#707070]">
                {new Date(existingReview.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-[#bdbdbd] leading-relaxed italic">
              "{existingReview.review_text}"
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-[#9a9a9a]">
              <div>Expertise: <span className="text-white font-medium">{existingReview.rating_expertise}/5</span></div>
              <div>Communication: <span className="text-white font-medium">{existingReview.rating_communication}/5</span></div>
              <div>Actionability: <span className="text-white font-medium">{existingReview.rating_actionability}/5</span></div>
            </div>

            {existingReview.mentor_response && (
              <div className="p-4 rounded-lg bg-white/[0.03] border-l-2 border-[#8052ff] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">Mentor Response ({booking.mentor.full_name})</span>
                  <span className="text-[#707070]">{existingReview.mentor_response_at ? new Date(existingReview.mentor_response_at).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-xs text-[#9a9a9a]">{existingReview.mentor_response}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-white/10 text-center space-y-2">
            <p className="text-xs text-[#9a9a9a]">
              {booking.status === 'completed'
                ? 'You have not submitted a review for this session yet.'
                : 'Verified review submission unlocks once your scheduled session concludes.'}
            </p>
            {booking.status === 'completed' && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-xs text-[#8052ff] hover:underline uppercase tracking-wider font-semibold"
              >
                Submit Consultation Review Now →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e11] border border-white/15 rounded-[24px] p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Submit Verified Session Review</h3>
                <p className="text-xs text-[#9a9a9a]">Mentor: {booking.mentor.full_name} • {booking.gig.title}</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#9a9a9a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star Rating Breakdown */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block">Overall Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-xl transition-all ${
                        s <= rating ? 'text-[#ffb829] bg-[#ffb829]/10' : 'text-[#707070] bg-white/5'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${s <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  <span className="text-sm font-semibold text-white ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">Domain Rigor</label>
                  <select
                    value={expertiseRating}
                    onChange={(e) => setExpertiseRating(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">Clarity</label>
                  <select
                    value={commRating}
                    onChange={(e) => setCommRating(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">Action ROI</label>
                  <select
                    value={actionRating}
                    onChange={(e) => setActionRating(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Written feedback */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Detailed Written Critique</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the actionable breakthroughs, takeaways, and value generated during this consultation..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Anonymity Shield Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <input
                  type="checkbox"
                  checked={isAnonymousReview}
                  onChange={(e) => setIsAnonymousReview(e.target.checked)}
                  className="rounded border-white/20 text-[#8052ff] bg-transparent"
                />
                <div className="text-xs">
                  <span className="text-white font-medium block">Publish Under Privacy Shield</span>
                  <span className="text-[10px] text-[#9a9a9a]">Mask your profile identity as "Verified Seeker" on public listings.</span>
                </div>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/10 hover:border-white/20 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewText.trim()}
                  className="flex-1 py-3 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-[#8052ff]/20"
                >
                  {submittingReview ? 'Publishing...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute / Escrow Hold Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e11] border border-white/15 rounded-[24px] p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#ff5c5c]" />
                  <h3 className="text-lg font-medium text-white">File Moderation Dispute</h3>
                </div>
                <p className="text-xs text-[#9a9a9a]">Freezes escrow payout until compliance arbitration review.</p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#9a9a9a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 text-xs text-[#bdbdbd] space-y-1">
                <span className="font-semibold text-white block">Escrow Protection Notice:</span>
                <span>Filing an issue holds the ₹{(booking.amount_inr || 0).toLocaleString('en-IN')} escrow balance from being transferred to the mentor pending evidence review.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Primary Cause</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value as any)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="quality_unmet">Session Quality Did Not Match Offering Terms</option>
                  <option value="no_show">Mentor Did Not Join Call (No-Show)</option>
                  <option value="unprofessional">Unprofessional Conduct or Boundary Breach</option>
                  <option value="technical_failure">Technical Failure / Infrastructure Interruption</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Detailed Incident Statement</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide precise chronological notes explaining why the session failed to deliver on agreed scope..."
                  value={disputeStatement}
                  onChange={(e) => setDisputeStatement(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#ff5c5c]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/10 hover:border-white/20 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute || !disputeStatement.trim()}
                  className="flex-1 py-3 rounded-full bg-[#ff5c5c] hover:bg-[#e04545] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  {submittingDispute ? 'Submitting...' : 'Freeze Escrow & Open Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   5. SEEKER MESSAGES PAGE
   ========================================================================== */
export const SeekerMessagesPage: React.FC = () => {
  const { profile } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      setLoading(true);
      const chs = await MessagingService.getChannels(profile?.id || 'usr-seeker-01', 'seeker');
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
    if (!inputText.trim() || !selectedChannelId) return;

    const newMsg = await MessagingService.sendMessage({
      channelId: selectedChannelId,
      senderId: profile?.id || 'usr-seeker-01',
      senderName: profile?.full_name || 'Alex Rivera',
      senderRole: 'seeker',
      senderAvatar: profile?.avatar_url,
      content: inputText.trim(),
    });

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Direct Advisory Messages</h1>
        <p className="text-sm text-[#9a9a9a]">Secure, encrypted participant-only channels linked to confirmed sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] border border-white/10 rounded-[24px] bg-white/[0.02] overflow-hidden">
        {/* Left: Channel List */}
        <div className="border-r border-white/10 p-4 space-y-2 overflow-y-auto max-h-[600px]">
          <span className="text-[11px] uppercase tracking-wider text-[#9a9a9a] px-3 font-semibold block mb-2">
            Active Conversations
          </span>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`w-full text-left p-3 rounded-2xl transition-all space-y-1.5 ${
                selectedChannelId === channel.id
                  ? 'bg-white/10 border border-white/15 text-white'
                  : 'hover:bg-white/5 text-[#9a9a9a] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={channel.mentor_avatar}
                  alt={channel.mentor_name}
                  className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white truncate">{channel.mentor_name}</h4>
                    <span className="text-[10px] text-[#707070]">
                      {new Date(channel.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <img
                    src={activeChannel.mentor_avatar}
                    alt={activeChannel.mentor_name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-white">{activeChannel.mentor_name}</h3>
                    <p className="text-xs text-[#9a9a9a] truncate max-w-xs">{activeChannel.mentor_headline}</p>
                  </div>
                </div>
                <Link
                  to={`/seeker/bookings/${activeChannel.booking_id}`}
                  className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline"
                >
                  View Booking Room →
                </Link>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2">
                {messages.map((msg) => {
                  const isMe = msg.sender_role === 'seeker';
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
                  placeholder="Type your message..."
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
              Select a conversation from the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   6. SEEKER PROFILE & PRIVACY SHIELD
   ========================================================================== */
export const SeekerProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || 'Alex Rivera');
  const [isAnonymous, setIsAnonymous] = useState(profile?.is_anonymous_enabled || false);
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      full_name: fullName,
      is_anonymous_enabled: isAnonymous,
    });
    setSaving(false);
    toast({
      title: 'Preferences Updated',
      description: 'Your profile and confidentiality shield settings have been saved.',
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-normal text-white">Profile & Privacy Shield</h1>
        <p className="text-sm text-[#9a9a9a]">
          Manage personal identity, confidential pseudonym shielding, and notification channels.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Account Details */}
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <h3 className="text-base font-medium text-white">Account Information</h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Email Address</label>
              <input
                type="email"
                value={profile?.email || 'alex.rivera@example.com'}
                disabled
                className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#707070] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#707070]">Email is managed via Supabase Auth</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+5:30)</option>
                <option value="America/New_York (EST)">America/New_York (EST - UTC-5)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST - UTC-8)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT - UTC+0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anonymity Shield (PRD Feature) */}
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-white">Confidentiality Shield</h3>
                <span className="text-[10px] uppercase tracking-wider text-[#ffb829] font-semibold px-2 py-0.5 rounded-full bg-[#ffb829]/10 border border-[#ffb829]/30">
                  Seeker Privacy
                </span>
              </div>
              <p className="text-xs text-[#9a9a9a] leading-relaxed">
                When enabled, your real name and avatar are masked with an anonymous pseudonym during advisory sessions and chat threads.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                isAnonymous ? 'bg-[#8052ff]' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isAnonymous ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {isAnonymous && (
            <div className="p-4 rounded-xl bg-[#8052ff]/10 border border-[#8052ff]/30 text-xs text-[#bdbdbd] space-y-1">
              <p className="font-semibold text-white">Shield Active:</p>
              <p>Advisors will see you as <span className="text-[#8052ff] font-mono">Seeker #{profile?.id ? profile.id.slice(-4) : '8421'}</span> unless you voluntarily disclose your identity during consultation.</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="p-6 md:p-8 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-medium text-white">Communication Preferences</h3>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white">Calendar & Booking Reminders</span>
              <p className="text-[11px] text-[#9a9a9a]">Receive email notifications 15 minutes before scheduled calls.</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="rounded border-white/20 text-[#8052ff] focus:ring-0 bg-transparent w-4 h-4"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-[#8052ff]/20"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};
