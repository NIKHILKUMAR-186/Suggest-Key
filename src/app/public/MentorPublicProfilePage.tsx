import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import {
  AdvisorService,
  AdvisorDetail,
  getCredentialsSummary,
  AvailabilitySlot,
} from '../../domains/advisor/AdvisorService';
import { Badge } from '../../components/ui/Badge';
import { SegmentService } from '../../domains/segment/SegmentService';
import { useAuth } from '../../domains/auth/AuthContext';
import { MentorSegment, Offering } from '../../lib/supabase/types';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck2,
  Lock,
  ArrowRight,
  ExternalLink,
  Settings as SettingsIcon,
  Users,
  MapPin,
  Award,
} from 'lucide-react';

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface OfferingGroup {
  segmentName: string;
  segmentSlug: string;
  segmentAccent: string;
  segmentIcon: string;
  offerings: Offering[];
}

export const MentorPublicProfilePage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();

  const [mentor, setMentor] = useState<AdvisorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[] | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const loadMentor = async () => {
      setLoading(true);
      if (!mentorId) return;

      const data = await AdvisorService.getAdvisorById(mentorId);
      setMentor(data);

      const ownProfile = user?.id === mentorId || profile?.id === mentorId;
      setIsOwnProfile(ownProfile);

      if (data) {
        const avail = await AdvisorService.getNextAvailability(mentorId);
        setAvailability(avail);
      }

      setLoading(false);
    };

    loadMentor();
  }, [mentorId, user, profile]);

  // Role-based redirect: mentors and admins viewing a mentor profile
  // are redirected to their own dashboard or admin detail page.
  useEffect(() => {
    if (!loading && user && role && mentorId) {
      const isSelf = user.id === mentorId;
      if (role === 'mentor' || role === 'admin') {
        if (isSelf) {
          navigate('/mentor/profile', { replace: true });
        } else if (role === 'admin') {
          navigate(`/admin/mentors/${mentorId}`, { replace: true });
        } else {
          navigate('/mentor', { replace: true });
        }
      }
    }
  }, [loading, user, role, mentorId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-[#9a9a9a]">Loading Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <PublicNav />
        <div className="flex-1 max-w-[1280px] mx-auto w-full pt-32 px-6 text-center space-y-6">
          <h2 className="text-2xl font-normal">Mentor not found</h2>
          <p className="text-sm text-[#9a9a9a]">
            The mentor profile you requested does not exist or is pending verification.
          </p>
          <Link
            to="/explore"
            className="inline-block px-6 py-3 bg-[#8052ff] text-white rounded-full text-xs font-semibold uppercase tracking-wider"
          >
            Return to Explore
          </Link>
        </div>
      </div>
    );
  }

  const creds = getCredentialsSummary(mentor);

  // Active segments from getAdvisorById (already filtered to status='active')
  const activeSegments = (mentor.mentor_segments || [])
    .filter((ms) => ms.status === 'active')
    .map((ms) => {
      const segData =
        ms.segment ||
        (ms.segment_id
          ? SegmentService.getCachedSegmentBySlug(ms.segment_id)
          : null);
      return {
        id: ms.id,
        name: segData?.name || ms.segment_id || 'Advisor',
        slug: segData?.slug || ms.segment_id || '',
        accent: segData?.accent || '#8052ff',
        icon: segData?.icon || 'Sparkles',
        use_cases: segData?.use_cases || [],
        badge: segData?.badge || '',
      };
    });

  // Group offerings by segment
  const grouping: Record<string, OfferingGroup> = {};
  const allOfferings = (mentor.offerings || []).filter(
    (o) => o.is_available !== false
  );

  allOfferings.forEach((offering) => {
    const seg = offering.mentor_segment?.segment;
    const segName = seg?.name || 'Uncategorized';
    const segSlug = seg?.slug || 'uncategorized';
    const key = segSlug;

    if (!grouping[key]) {
      grouping[key] = {
        segmentName: segName,
        segmentSlug: segSlug,
        segmentAccent: seg?.accent || '#8052ff',
        segmentIcon: seg?.icon || 'Sparkles',
        offerings: [],
      };
    }
    grouping[key].offerings.push(offering);
  });

  const offeringGroups: OfferingGroup[] = Object.values(grouping).sort(
    (a, b) => a.segmentName.localeCompare(b.segmentName)
  );

  // Primary offering for the booking widget preview
  const allOfferingList = offeringGroups.flatMap((g) => g.offerings);
  const primaryOffering = allOfferingList[0];

  // Reviews from getAdvisorById (now fetched)
  const reviews = mentor.reviews || [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between">
      <PublicNav />

      <main className="w-full pt-28 pb-24 px-6 max-w-[1280px] mx-auto flex-1 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Specialists</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#9a9a9a]">
            <span>ID:</span>
            <span className="font-mono text-white text-[11px]">{mentor.id}</span>
          </div>
        </div>

        {/* Role-aware header: show edit button for own profile */}
        {isOwnProfile && (
          <div className="flex justify-end">
            <Link
              to="/mentor/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Edit Your Profile</span>
            </Link>
          </div>
        )}

        {/* Editorial Profile Monolith Header */}
        <div className="p-8 sm:p-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent space-y-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 justify-between">
            {/* Avatar & Core Bio Info */}
            <div className="flex flex-col sm:flex-row items-start gap-6 max-w-3xl">
              <div className="relative shrink-0">
                <img
                  src={
                    mentor.profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={mentor.profile?.full_name || 'Mentor'}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-[28px] object-cover border border-white/15 shadow-2xl"
                />
                {mentor.verification_status === 'approved' && (
                  <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#0e0e0e] border border-[#15846e] flex items-center gap-1 text-[#15846e] text-[10px] font-semibold uppercase tracking-wider shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audited</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-white">
                    {mentor.profile?.full_name || 'Mentor'}
                  </h1>
                  {creds.isVerified && (
                    <Badge variant="verdant" icon={<ShieldCheck className="w-3 h-3" />}>
                      Credentials Verified
                    </Badge>
                  )}
                </div>

                <p className="text-sm sm:text-base text-[#8052ff] font-medium leading-snug">
                  {mentor.headline}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#9a9a9a] pt-1">
                  <div className="flex items-center gap-1.5 text-[#ffb829]">
                    <Star className="w-4 h-4 fill-[#ffb829]" />
                    <span className="font-semibold text-white">
                      {(mentor.rating || 5).toFixed(2)}
                    </span>
                    <span>({mentor.review_count || 0} reviews)</span>
                  </div>
                  <span>•</span>
                  <span>{mentor.experience_years || 5}+ Years Verified Practice</span>
                  {creds.credentialsUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={creds.credentialsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8052ff] hover:text-white transition-colors flex items-center gap-1"
                        title="View verified credentials"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Credentials</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Session Booking Widget Preview */}
            {primaryOffering && (
              <div className="w-full lg:w-80 p-6 rounded-[24px] border border-[#8052ff]/30 bg-[#8052ff]/5 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold">
                    1:1 Session Fee
                  </span>
                  <span className="text-2xl font-semibold text-white">
                    ₹{(primaryOffering.price_inr || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-[#bdbdbd]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8052ff]" />
                    <span>{primaryOffering.duration_minutes} Minutes Private Call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Actionable roadmap included</span>
                  </div>
                </div>
                {!isOwnProfile && role === 'seeker' && (
                  <Link
                    to={`/mentor/${mentorId}/offering/${primaryOffering.id}`}
                    className="w-full py-3.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#8052ff]/25"
                  >
                    <span>Book Consultation</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Segment Pills */}
        {activeSegments.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold">
              Advisory Segments:
            </span>
            {activeSegments.map((ms) => (
              <Badge key={ms.id} color={ms.accent} icon={null} size="sm">
                {ms.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Availability Display (read-only) */}
        {availability && availability.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8052ff]" />
              <span>Available Hours</span>
            </h2>
            <div className="p-6 rounded-[28px] border border-white/10 bg-white/[0.015] space-y-3">
              <div className="flex flex-wrap gap-3">
                {availability.map((slot, i) => (
                  <div
                    key={i}
                    className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/5 text-xs"
                  >
                    <span className="text-[#8052ff] font-semibold">
                      {DAY_LABELS[slot.dayOfWeek]}:
                    </span>{' '}
                    <span className="text-[#bdbdbd]">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Content Body: Dual Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Biography, Credentials Audit & Reviews */}
          <div className="lg:col-span-8 space-y-12">
            {/* Bio Statement */}
            <div className="space-y-4">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8052ff]" />
                <span>Practice & Advisory Philosophy</span>
              </h2>
              <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] text-sm sm:text-base text-[#bdbdbd] font-light leading-relaxed space-y-4">
                <p>{mentor.bio}</p>
              </div>
            </div>

            {/* Specialties */}
            {mentor.specialties && mentor.specialties.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#ffb829]" />
                  <span>Specialties</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mentor.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="text-xs text-[#bdbdbd] px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Credential Audit Spec Sheet (real DB fields) */}
            {creds.isVerified && (creds.credentialsUrl || creds.verifiedDate) && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#15846e]" />
                  <span>Audited Credentials</span>
                </h2>

                <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    {creds.displayLine && (
                      <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                        <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">
                          Degree / Certification
                        </span>
                        <span className="text-white font-medium">
                          {creds.displayLine}
                        </span>
                      </div>
                    )}
                    {creds.verifiedDate && (
                      <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                        <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">
                          Audit Verification Date
                        </span>
                        <span className="text-white font-medium">
                          {creds.verifiedDate}
                        </span>
                      </div>
                    )}
                    {creds.credentialsUrl && (
                      <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1 sm:col-span-2">
                        <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">
                          Credential Document
                        </span>
                        <a
                          href={creds.credentialsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8052ff] hover:text-white transition-colors flex items-center gap-1.5 break-all"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>View Verified Credentials</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#9a9a9a] pt-2">
                    <Lock className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Credentials independently verified by Suggest Key Operations & Safety Team.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verified Seeker Reviews */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#ffb829] fill-[#ffb829]" />
                  <span>Verified Seeker Reviews ({reviews.length})</span>
                </h2>
                <span className="text-xs text-[#9a9a9a]">100% Verified Post-Session Feedback</span>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {rev.seeker_avatar ? (
                            <img
                              src={rev.seeker_avatar}
                              alt={rev.seeker_name || 'Seeker'}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[#8052ff] font-semibold">
                              {(rev.seeker_name || 'S').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-white">
                              {rev.seeker_name || 'Verified Seeker'}
                            </div>
                            <div className="text-[10px] text-[#9a9a9a]">
                              Verified 1:1 Session
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[#ffb829]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(rev.rating)
                                  ? 'fill-[#ffb829]'
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#bdbdbd] font-light leading-relaxed">
                        "{rev.comment || rev.review_text}"
                      </p>

                      {rev.mentor_response && (
                        <div className="pt-3 border-t border-white/5 space-y-1">
                          <div className="text-[10px] uppercase tracking-wider text-[#9a9a9a]">
                            Mentor response
                          </div>
                          <p className="text-xs text-[#9a9a9a] italic leading-relaxed">
                            "{rev.mentor_response}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.01] text-center text-xs text-[#9a9a9a]">
                  No public reviews submitted yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Available Offerings grouped by segment */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-6 sticky top-28">
              <h2 className="text-lg font-medium text-white flex items-center justify-between">
                <span>1:1 Advisory Offerings</span>
                <span className="text-xs text-[#8052ff] font-normal">
                  {allOfferingList.length} Available
                </span>
              </h2>

              {allOfferingList.length === 0 ? (
                <div className="p-8 rounded-[24px] border border-dashed border-white/10 text-center text-xs text-[#9a9a9a]">
                  No offerings currently listed.
                </div>
              ) : (
                <div className="space-y-6">
                  {offeringGroups.map((group) => (
                    <div key={group.segmentSlug} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: group.segmentAccent }}
                        />
                        <span
                          className="font-semibold"
                          style={{ color: group.segmentAccent }}
                        >
                          {group.segmentName}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {group.offerings.map((item) => (
                          <div
                            key={item.id}
                            className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-4 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium text-white leading-snug">
                                {item.title}
                              </h3>
                              <span className="text-sm font-bold text-white shrink-0">
                                ₹{(item.price_inr || 0).toLocaleString('en-IN')}
                              </span>
                            </div>

                            <p className="text-xs text-[#9a9a9a] leading-relaxed line-clamp-2">
                              {item.description}
                            </p>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold block">
                                Included Deliverables:
                              </span>
                              {(item.deliverables || []).slice(0, 2).map(
                                (d, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 text-[11px] text-[#bdbdbd]"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-[#15846e] shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{d}</span>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs">
                              <span className="text-[#9a9a9a] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {item.duration_minutes} Mins
                              </span>
                              {!isOwnProfile && role === 'seeker' && (
                                <Link
                                  to={`/mentor/${mentorId}/offering/${item.id}`}
                                  className="px-4 py-2 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 shadow-sm"
                                >
                                  <span>Book</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#9a9a9a]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Suggest Key • Audited 1:1 Human Intelligence Directory</span>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="hover:text-white">
              All Specialists
            </Link>
            <span>•</span>
            <Link to="/signup?role=mentor" className="hover:text-white">
              Become an Advisor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
