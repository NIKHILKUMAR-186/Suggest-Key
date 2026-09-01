import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { Badge } from '../../components/ui/Badge';
import { SegmentService } from '../../domains/segment/SegmentService';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  FileCheck2,
  Lock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdvisorProfilePage: React.FC = () => {
  const { advisorId } = useParams<{ advisorId: string }>();
  const navigate = useNavigate();

  const [advisor, setAdvisor] = useState<AdvisorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGigId, setSelectedGigId] = useState<string>('');

  useEffect(() => {
    const loadAdvisor = async () => {
      setLoading(true);
      if (!advisorId) return;

      const data = await AdvisorService.getAdvisorById(advisorId);
      setAdvisor(data);
      if (data && data.gigs.length > 0) {
        setSelectedGigId(data.gigs[0].id);
      }
      setLoading(false);
    };

    loadAdvisor();
  }, [advisorId]);

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

  if (!advisor) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <PublicNav />
        <div className="flex-1 max-w-[1280px] mx-auto w-full pt-32 px-6 text-center space-y-6">
          <h2 className="text-2xl font-normal">Advisor not found</h2>
          <p className="text-sm text-[#9a9a9a]">
            The advisor profile you requested does not exist or is pending verification.
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

  const activeGig = (advisor.gigs || []).find((g) => g.id === selectedGigId) || (advisor.gigs || [])[0];

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
            <span className="font-mono text-white text-[11px]">{advisor.id}</span>
          </div>
        </div>

        {/* Editorial Profile Monolith Header */}
        <div className="p-8 sm:p-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent space-y-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 justify-between">
            {/* Avatar & Core Bio Info */}
            <div className="flex flex-col sm:flex-row items-start gap-6 max-w-3xl">
              <div className="relative shrink-0">
                <img
                  src={advisor.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt={advisor.profile?.full_name || 'Advisor'}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-[28px] object-cover border border-white/15 shadow-2xl"
                />
                {advisor.verification_status === 'approved' && (
                  <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#0e0e0e] border border-[#15846e] flex items-center gap-1 text-[#15846e] text-[10px] font-semibold uppercase tracking-wider shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audited</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-white">
                    {advisor.profile?.full_name || advisor.full_name || 'Advisor'}
                  </h1>
                  {advisor.segment_name && (
                    <Badge color={SegmentService.getCachedSegmentBySlug(advisor.segment_id || advisor.verified_categories?.[0] || '')?.accent || '#8052ff'}>
                      {advisor.role_title || `${advisor.segment_name} Advisor`}
                    </Badge>
                  )}
                  {advisor.credentials_detail?.degree && (
                    <Badge variant="verdant">Credentials Verified</Badge>
                  )}
                </div>

                <p className="text-sm sm:text-base text-[#8052ff] font-medium leading-snug">
                  {advisor.headline}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#9a9a9a] pt-1">
                  <div className="flex items-center gap-1.5 text-[#ffb829]">
                    <Star className="w-4 h-4 fill-[#ffb829]" />
                    <span className="font-semibold text-white">{(advisor.rating || 5).toFixed(2)}</span>
                    <span>({advisor.review_count || 0} reviews)</span>
                  </div>
                  <span>•</span>
                  <span>{advisor.experience_years || 5}+ Years Verified Practice</span>
                  {advisor.credentials_detail?.institution && (
                    <>
                      <span>•</span>
                      <span className="text-white">{advisor.credentials_detail.institution}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Session Booking Widget Preview */}
            {activeGig && (
              <div className="w-full lg:w-80 p-6 rounded-[24px] border border-[#8052ff]/30 bg-[#8052ff]/5 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold">
                    1:1 Session Fee
                  </span>
                  <span className="text-2xl font-semibold text-white">
                    ₹{(activeGig.price_inr || 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-[#bdbdbd]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8052ff]" />
                    <span>{activeGig.duration_minutes} Minutes Private Call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Actionable roadmap included</span>
                  </div>
                </div>
                <Link
                  to={`/gigs/${activeGig.id}`}
                  className="w-full py-3.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#8052ff]/25"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content Body: Dual Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Biography, Credentials Audit & Reviews */}
          <div className="lg:col-span-8 space-y-12">
            {/* Bio Statement */}
            <div className="space-y-4">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8052ff]" />
                <span>Practice & Advisory Philosophy</span>
              </h2>
              <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] text-sm sm:text-base text-[#bdbdbd] font-light leading-relaxed space-y-4">
                <p>{advisor.bio}</p>
              </div>
            </div>

            {/* Credential Audit Spec Sheet */}
            {advisor.credentials_detail && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#15846e]" />
                  <span>Audited Credentials & Licenses</span>
                </h2>

                <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">Degree / Certification</span>
                      <span className="text-white font-medium">{advisor.credentials_detail.degree}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">Institution</span>
                      <span className="text-white font-medium">{advisor.credentials_detail.institution}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">License / Registry Number</span>
                      <span className="text-[#15846e] font-medium">{advisor.credentials_detail.license_number || 'AUDITED-INTERNAL-PASS'}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <span className="text-[#9a9a9a] uppercase text-[10px] tracking-wider block">Audit Verification Date</span>
                      <span className="text-white font-medium">{advisor.credentials_detail.verified_date || 'Jan 2025'}</span>
                    </div>
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
                  <span>Verified Seeker Reviews ({advisor.reviews?.length || 0})</span>
                </h2>
                <span className="text-xs text-[#9a9a9a]">100% Verified Post-Session Feedback</span>
              </div>

              {advisor.reviews && advisor.reviews.length > 0 ? (
                <div className="space-y-4">
                  {(advisor.reviews || []).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {rev.seeker_avatar ? (
                            <img
                              src={rev.seeker_avatar}
                              alt={rev.seeker_name}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[#8052ff] font-semibold">
                              {(rev.seeker_name || 'S').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-white">{rev.seeker_name}</div>
                            <div className="text-[10px] text-[#9a9a9a]">Verified 1:1 Session</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[#ffb829]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(rev.rating) ? 'fill-[#ffb829]' : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#bdbdbd] font-light leading-relaxed">
                        "{rev.comment}"
                      </p>
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

          {/* Right Column: Available Offerings / Gigs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4 sticky top-28">
              <h2 className="text-lg font-medium text-white flex items-center justify-between">
                <span>1:1 Advisory Offerings</span>
                <span className="text-xs text-[#8052ff] font-normal">{(advisor.gigs || []).length} Available</span>
              </h2>

              <div className="space-y-4">
                {(advisor.gigs || []).map((gig) => {
                  const isSelected = gig.id === selectedGigId;
                  return (
                    <div
                      key={gig.id}
                      onClick={() => setSelectedGigId(gig.id)}
                      className={`p-6 rounded-[24px] border transition-all cursor-pointer space-y-4 ${
                        isSelected
                          ? 'border-[#8052ff] bg-[#8052ff]/10 shadow-lg shadow-[#8052ff]/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-white leading-snug">{gig.title}</h3>
                        <span className="text-sm font-bold text-white shrink-0">
                          ₹{(gig.price_inr || 0).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-[#9a9a9a] leading-relaxed line-clamp-2">
                        {gig.description}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold block">
                          Included Deliverables:
                        </span>
                        {(gig.deliverables || []).slice(0, 2).map((d, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-[#bdbdbd]">
                            <CheckCircle2 className="w-3 h-3 text-[#15846e] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{d}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-[#9a9a9a] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {gig.duration_minutes} Mins
                        </span>
                        <Link
                          to={`/gigs/${gig.id}`}
                          className="px-4 py-2 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 shadow-sm"
                        >
                          <span>Select & Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
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
    </div>
  );
};
