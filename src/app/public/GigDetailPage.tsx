import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { Gig, Offering } from '../../lib/supabase/types';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { useAuth } from '../../domains/auth/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { BookingCheckoutModal } from '../../components/booking/BookingCheckoutModal';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  UserCheck,
  Video,
  FileText,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export const GigDetailPage: React.FC = () => {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [gigData, setGigData] = useState<{
    gig: Gig;
    advisor: AdvisorDetail;
    segment: AdvisorySegment | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Slot Selection Prototype State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [seekerIntentNote, setSeekerIntentNote] = useState<string>('');
  const [isAnonymousBooking, setIsAnonymousBooking] = useState<boolean>(false);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    const loadGig = async () => {
      setLoading(true);
      if (!gigId) return;

      const res = await AdvisorService.getGigById(gigId);
      setGigData(res);
      setLoading(false);
    };

    loadGig();
  }, [gigId]);

  const handleProceedToBooking = () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: { pathname: `/gigs/${gigData?.gig.id}` },
        },
      });
      return;
    }

    setIsCheckoutModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!gigData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-normal">Advisory Offering Not Found</h2>
        <Link to="/explore" className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const { gig, advisor, segment } = gigData;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between">
      <PublicNav />

      <main className="w-full pt-28 pb-24 px-6 max-w-[1280px] mx-auto flex-1 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#9a9a9a]">
          <Link to="/explore" className="hover:text-white transition-colors uppercase tracking-wider">
            Explore
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/explore/${segment?.slug || 'all'}`} className="hover:text-white transition-colors uppercase tracking-wider">
            {segment?.name || 'Advisory Segment'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/mentor/${advisor.id}`} className="hover:text-white transition-colors uppercase tracking-wider">
            {advisor.profile.full_name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white truncate max-w-xs">{gig.title}</span>
        </div>

        {/* Hero Offering Header Card */}
        <div className="p-8 sm:p-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-widest text-[#8052ff] font-semibold">
              1:1 Advisory Session
            </span>
            <Badge variant="iris">{segment?.name || 'Advisory Segment'}</Badge>
            {advisor.verification_status === 'approved' && (
              <Badge variant="verdant">100% Audited Advisor</Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.03em] text-white max-w-4xl leading-tight">
            {gig.title}
          </h1>

          <p className="text-sm sm:text-base text-[#9a9a9a] font-light leading-relaxed max-w-3xl">
            {gig.description}
          </p>

          {/* Advisor Strip Inside Header */}
          <div className="p-4 sm:p-6 rounded-[24px] border border-white/10 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl">
            <div className="flex items-center gap-4">
              <Link to={`/mentor/${advisor.id}`}>
                <img
                  src={advisor.profile.avatar_url || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'}
                  alt={advisor.profile.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/mentor/${advisor.id}`}
                    className="font-medium text-base text-white hover:text-[#8052ff] transition-colors"
                  >
                    {advisor.profile.full_name}
                  </Link>
                  <ShieldCheck className="w-4 h-4 text-[#15846e]" />
                </div>
                <p className="text-xs text-[#9a9a9a]">{advisor.headline}</p>
              </div>
            </div>

            <Link
              to={`/mentor/${advisor.id}`}
              className="text-xs uppercase tracking-wider text-[#8052ff] hover:underline font-semibold"
            >
              View Full Credentials →
            </Link>
          </div>
        </div>

        {/* Content Layout: Deliverables & Specifications vs Atomic Slot Booking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Scope, Format, Guarantee */}
          <div className="lg:col-span-7 space-y-10">
            {/* Structured Deliverables */}
            <div className="space-y-4">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8052ff]" />
                <span>Session Deliverables & Concrete Takeaways</span>
              </h2>

              <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] space-y-4">
                {(gig.deliverables || []).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm text-[#bdbdbd] font-light leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-[#15846e]/10 text-[#15846e] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Architecture & Tech Protocol */}
            <div className="space-y-4">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-[#ffb829]" />
                <span>How This Session is Conducted</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-[#8052ff] font-semibold block">
                    Duration & Format
                  </span>
                  <div className="text-lg font-medium text-white">{gig.duration_minutes} Minutes</div>
                  <p className="text-xs text-[#9a9a9a] leading-relaxed">
                    High-bandwidth, encrypted 1:1 video or audio session with real-time screen sharing and notes.
                  </p>
                </div>

                <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-[#15846e] font-semibold block">
                    Seeker Confidentiality
                  </span>
                  <div className="text-lg font-medium text-white">Full Anonymity Available</div>
                  <p className="text-xs text-[#9a9a9a] leading-relaxed">
                    Book under a cryptographic pseudonym if you require complete privacy from your employer or peers.
                  </p>
                </div>

                <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-[#ffb829] font-semibold block">
                    Pre-Call Preparation
                  </span>
                  <div className="text-lg font-medium text-white">Direct Intake Notes</div>
                  <p className="text-xs text-[#9a9a9a] leading-relaxed">
                    Submit your specific crossroad dilemmas or architecture diagrams prior to the call.
                  </p>
                </div>

                <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-[#8052ff] font-semibold block">
                    Post-Call Momentum
                  </span>
                  <div className="text-lg font-medium text-white">7-Day Direct Chat</div>
                  <p className="text-xs text-[#9a9a9a] leading-relaxed">
                    Access to 1:1 secure chat channel for follow-up questions and roadmap validation.
                  </p>
                </div>
              </div>
            </div>

            {/* Zero-Conflict Database Guarantee Banner */}
            <div className="p-6 rounded-[24px] border border-white/10 bg-black/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-[#15846e]" />
                <span>Suggest Key Atomic Scheduling Architecture</span>
              </div>
              <p className="text-xs text-[#9a9a9a] leading-relaxed">
                Slots are locked atomically using PostgreSQL range exclusion constraints. Double-booking is mathematically impossible across timezones.
              </p>
            </div>
          </div>

          {/* Right Column: Atomic Slot Selection & Intent Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-[32px] border border-[#8052ff]/30 bg-gradient-to-b from-[#8052ff]/10 to-white/[0.01] space-y-6 sticky top-28">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#ffb829] font-semibold block">
                    Direct 1:1 Consultation
                  </span>
                  <div className="text-3xl font-bold text-white">
                    ₹{(gig.price_inr || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#9a9a9a] block">Duration</span>
                  <span className="text-sm font-semibold text-white">{gig.duration_minutes} Mins</span>
                </div>
              </div>

              {/* Date Selection Strip */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  1. Select Available Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.length > 0 ? availableDates.map((dateStr) => {
                    const isSelected = selectedDate === dateStr;
                    const date = new Date(dateStr + 'T00:00:00');
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-[#8052ff] bg-[#8052ff] text-white shadow-md shadow-[#8052ff]/30'
                            : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-light">{dayLabel}</div>
                        <div className="text-xs font-semibold">{dateNum}</div>
                      </button>
                    );
                  }) : (
                    <div className="col-span-4 text-xs text-[#9a9a9a] text-center py-4">
                      No available dates. Please check back later.
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  2. Select Time Slot (IST)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.length > 0 ? availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-2xl border text-xs font-medium text-center transition-all ${
                          isSelected
                            ? 'border-[#8052ff] bg-[#8052ff]/20 text-white border-2'
                            : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  }) : (
                    <div className="col-span-2 text-xs text-[#9a9a9a] text-center py-4">
                      No available time slots. Please check back later.
                    </div>
                  )}
                </div>
              </div>

              {/* Crossroad Context Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  3. What crossroad or bottleneck are you facing?
                </label>
                <textarea
                  rows={3}
                  value={seekerIntentNote}
                  onChange={(e) => setSeekerIntentNote(e.target.value)}
                  placeholder="e.g. Navigating a promotion to Staff Eng, executive burnout symptoms, evaluating term sheet..."
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#9a9a9a]/40 text-xs focus:outline-none focus:border-[#8052ff] resize-none"
                />
              </div>

              {/* Anonymous Seeker Toggle */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Seeker Anonymity Shield</span>
                  </div>
                  <div className="text-[10px] text-[#9a9a9a]">Hide real name & identity from advisor</div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymousBooking}
                  onChange={(e) => setIsAnonymousBooking(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full py-4 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-[#8052ff]/30 flex items-center justify-center gap-2"
              >
                <span>Lock Slot & Book Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-[#9a9a9a] text-center font-light leading-relaxed">
                Escrow protected • Cancel up to 24 hours prior for a full refund.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#9a9a9a]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Suggest Key • Audited 1:1 Human Intelligence Directory</span>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="hover:text-white">All Specialists</Link>
            <span>•</span>
            <Link to="/signup?role=mentor" className="hover:text-white">Become an Advisor</Link>
          </div>
        </div>
      </footer>

      {/* Atomic Checkout & Payment Modal */}
      {gigData && (
        <BookingCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          advisor={gigData.advisor}
          offering={{
            id: gigData.gig.id,
            mentor_segment_id: '',
            title: gigData.gig.title,
            slug: gigData.gig.slug,
            description: gigData.gig.description,
            duration_minutes: gigData.gig.duration_minutes,
            price_inr: gigData.gig.price_inr,
            deliverables: gigData.gig.deliverables,
            is_available: gigData.gig.is_published,
            created_at: gigData.gig.created_at,
            updated_at: gigData.gig.updated_at,
          } as Offering}
          initialDate={selectedDate}
          initialNotes={seekerIntentNote}
          initialIsAnonymous={isAnonymousBooking}
        />
      )}
    </div>
  );
};
