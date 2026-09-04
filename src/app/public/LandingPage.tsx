import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { ConstellationCanvas } from '../../components/visual/ConstellationCanvas';
import { Badge } from '../../components/ui/Badge';
import { Tag } from '../../components/ui/Tag';
import { SectionHeader } from '../../components/ui/Headers';
import { AdvisorySegmentSlug } from '../../domains/segment/SegmentTypes';
import { AdvisorService, AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { SegmentService, AdvisorySegment } from '../../domains/segment/SegmentService';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Compass,
  HelpCircle,
  FileCheck2,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Heart,
  Briefcase,
  Brain,
} from 'lucide-react';

interface FeaturedAdvisor {
  id: string;
  name: string;
  role: string;
  credentials: string;
  category: string;
  categorySlug: string;
  rating: number;
  sessionsCount: number;
  avatarUrl: string;
  headlineSession: string;
  duration: string;
  price: string;
  tags: string[];
  verified: boolean;
}

const STEPS = [
  {
    step: '01',
    title: 'Choose your advisory path',
    description: 'Select from our three specialized segments: Relationship, Career, or Mental Health.',
    icon: <Compass className="w-5 h-5 text-[#8052ff]" />,
  },
  {
    step: '02',
    title: 'Match with an audited specialist',
    description: 'Inspect verified state licenses, accredited degrees, transparent hourly fees, and real reviews.',
    icon: <ShieldCheck className="w-5 h-5 text-[#15846e]" />,
  },
  {
    step: '03',
    title: 'Lock a focused 45-minute 1:1 session',
    description: 'Atomic slot booking with zero scheduling friction and secure private video consultation.',
    icon: <Calendar className="w-5 h-5 text-[#ffb829]" />,
  },
  {
    step: '04',
    title: 'Execute with an actionable roadmap',
    description: 'Walk away with a concrete diagnostic takeaway matrix and structured next steps.',
    icon: <Sparkles className="w-5 h-5 text-[#8052ff]" />,
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchIntent, setSearchIntent] = useState('');
  const [featuredAdvisors, setFeaturedAdvisors] = useState<FeaturedAdvisor[]>([]);
  const [advisorySegments, setAdvisorySegments] = useState<AdvisorySegment[]>([]);
  const [platformStats, setPlatformStats] = useState({
    totalSessions: 0,
    averageRating: 0,
    totalAdvisors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch segments
        const segments = await SegmentService.getActiveSegments();
        setAdvisorySegments(segments);

        // Fetch featured advisors (top 3 by rating)
        const advisorsResponse = await AdvisorService.getPaginatedAdvisors({
          limit: 3,
          page: 1,
        });

        const featured = advisorsResponse.advisors.map((adv) => ({
          id: adv.id,
          name: adv.profile?.full_name || 'Advisor',
          role: `${adv.headline?.split('|')[0]?.trim() || 'Advisor'}`,
          credentials: `${adv.experience_years}+ years experience`,
          category: adv.verified_categories?.[0] || 'General',
          categorySlug: adv.verified_categories?.[0] || 'general',
          rating: adv.rating,
          sessionsCount: adv.review_count,
          avatarUrl: adv.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
          headlineSession: adv.gigs?.[0]?.title || '1:1 Advisory Session',
          duration: `${adv.gigs?.[0]?.duration_minutes || 45} mins`,
          price: `₹${adv.gigs?.[0]?.price_inr?.toLocaleString() || '3,500'}`,
          tags: adv.specialties || [],
          verified: adv.verification_status === 'approved',
        }));

        setFeaturedAdvisors(featured);

        // Calculate platform stats
        const allAdvisors = await AdvisorService.getAllAdvisors();
        const totalSessions = allAdvisors.reduce((sum, a) => sum + a.review_count, 0);
        const avgRating = allAdvisors.length > 0
          ? allAdvisors.reduce((sum, a) => sum + a.rating, 0) / allAdvisors.length
          : 0;

        setPlatformStats({
          totalSessions,
          averageRating: Math.round(avgRating * 100) / 100,
          totalAdvisors: allAdvisors.length,
        });
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchIntent.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchIntent.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const getSegmentIcon = (slug: string) => {
    switch (slug) {
      case 'relationship': return Heart;
      case 'career': return Briefcase;
      case 'mental-health': return Brain;
      default: return Sparkles;
    }
  };

  const getSegmentAccent = (slug: string) => {
    switch (slug) {
      case 'relationship': return 'amber' as const;
      case 'career': return 'iris' as const;
      case 'mental-health': return 'verdant' as const;
      default: return 'iris' as const;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between overflow-x-hidden">
      <PublicNav />

      {/* Main Page Body */}
      <main className="w-full pt-20">
        {/* =========================================================================
            HERO SECTION: Monolithic Typography + Procedural Constellation Canvas
           ========================================================================= */}
        <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-20 px-6 border-b border-white/5 overflow-hidden">
          {/* Background Interactive Particle Canvas */}
          <div className="absolute inset-0 z-0 opacity-40">
            <ConstellationCanvas />
          </div>

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />

          <div className="relative z-10 max-w-[1280px] w-full mx-auto flex flex-col items-center text-center space-y-8">
            {/* Top Eyebrow Chip */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#15846e] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#bdbdbd]">
                Direct 1:1 Human Intelligence
              </span>
            </div>

            {/* Monolithic Hero Title */}
            <h3 className="text-display font-normal bg-gradiant
             text-white max-w tracking-tight leading-[0.92]">
              People who have crossed the bridge you stand before.
            </h3>

            {/* Hero Subtitle */}
            <p className="text-body-custom text-[#9a9a9a] max-w-2xl font-light text-lg sm:text-xl leading-relaxed">
              When facing critical crossroads in <strong>Relationship</strong>, <strong>Career</strong>, or <strong>Mental Health</strong>, generic search engines fail. Talk directly to credential-audited advisors who have walked the path.
            </p>

            {/* Interactive Intent Search Pill */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-2xl bg-[#0e0e0e]/90 border border-white/15 hover:border-[#8052ff]/50 focus-within:border-[#8052ff] p-2 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-3 transition-all duration-300"
            >
              <div className="pl-4 text-[#8052ff]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchIntent}
                onChange={(e) => setSearchIntent(e.target.value)}
                placeholder="What crossroads are you navigating? (e.g. Relationship conflict, Staff+ promotion, Burnout)"
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-[#9a9a9a]/60 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 shadow-md shadow-[#8052ff]/25"
              >
                Find Advisor
              </button>
            </form>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs uppercase tracking-wider text-[#9a9a9a] mr-2">Advisory Paths:</span>
              <Tag
                label="Relationship Dynamics"
                onClick={() => navigate(`/explore?segment=${AdvisorySegmentSlug.Relationship}`)}
              />
              <Tag
                label="Career & Staff+ Growth"
                onClick={() => navigate(`/explore?segment=${AdvisorySegmentSlug.Career}`)}
              />
              <Tag
                label="Mental Health & Burnout"
                onClick={() => navigate(`/explore?segment=${AdvisorySegmentSlug.MentalHealth}`)}
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate('/discover')}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all border border-white/10 inline-flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Can't decide which to choose?
              </button>
            </div>

            {/* Platform Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-4xl w-full border-t border-white/10 mt-6">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-white">
                  {isLoading ? '...' : `${advisorySegments.length} Segments`}
                </div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                  {advisorySegments.map(s => s.name.split(' ')[0]).join(' • ') || 'Relationship • Career • Mental Health'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#8052ff]">100%</div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Audited Credentials</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#15846e]">
                  {isLoading ? '...' : `${platformStats.totalSessions}+`}
                </div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Sessions Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#ffb829]">
                  {isLoading ? '...' : `${platformStats.averageRating} ★`}
                </div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Average Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: Choose Your Advisory Path (Dynamic Segments)
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            eyebrow="Advisory System"
            title="Choose Your Advisory Path"
            description="We focus strictly on the three foundational pillars of human performance and well-being. Each segment is governed by rigorous verification standards."
            action={
              <Link
                to="/discover"
                className="text-xs uppercase tracking-wider text-[#8052ff] hover:text-[#a07cff] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Open discovery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />

          <div className="flex justify-end -mt-8">
            <button
              onClick={() => navigate('/discover')}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9a9a9a] hover:text-white text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all border border-white/5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Can't decide? Describe your situation →
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 rounded-[28px] border border-white/10 bg-white/[0.015] animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 mb-4" />
                  <div className="h-8 bg-white/5 rounded mb-2" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {advisorySegments.map((seg) => {
                const Icon = getSegmentIcon(seg.slug);
                return (
                  <Link
                    key={seg.id}
                    to={`/discover?segment=${seg.slug}`}
                    className="p-8 rounded-[28px] border border-white/10 hover:border-[#8052ff]/50 bg-white/[0.015] hover:bg-white/[0.035] transition-all duration-300 flex flex-col justify-between space-y-8 group relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8052ff] group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant={getSegmentAccent(seg.slug)}>{seg.badge || 'Audited Specialists'}</Badge>
                      </div>
                      <div className="space-y-2 pt-2">
                        <h3 className="text-2xl font-medium text-white group-hover:text-[#8052ff] transition-colors">
                          {seg.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed font-light">
                          {seg.short_description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-[#9a9a9a]">
                      <span className="font-light">{seg.audience || 'Audited Specialists'}</span>
                      <div className="flex items-center gap-1 font-semibold uppercase tracking-wider text-white group-hover:text-[#8052ff] transition-colors">
                        <span>Explore</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 3: Featured Audited Advisors (Editorial Showcase)
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            eyebrow="Audited Specialists"
            title="People worth 45 minutes of your undivided focus"
            description="Inspect real qualifications, transparent hourly fees, and direct session booking across our three segments."
            action={
              <Link
                to="/explore"
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Browse Full Directory
              </Link>
            }
          />

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 animate-pulse">
                  <div className="w-16 h-16 rounded-[20px] bg-white/5 mb-4" />
                  <div className="h-6 bg-white/5 rounded mb-2" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredAdvisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all duration-300 relative group"
                >
                  <div className="space-y-6">
                    {/* Segment Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#8052ff] uppercase tracking-wider">
                        {advisor.category} Advisory
                      </span>
                      <Badge variant="verdant">Audited License</Badge>
                    </div>

                    {/* Advisor Header */}
                    <div className="flex items-start gap-4">
                      <img
                        src={advisor.avatarUrl}
                        alt={advisor.name}
                        className="w-16 h-16 rounded-[20px] object-cover border border-white/10 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-white">{advisor.name}</h3>
                          {advisor.verified && (
                            <ShieldCheck className="w-4 h-4 text-[#15846e]" />
                          )}
                        </div>
                        <p className="text-xs text-[#8052ff] font-medium">{advisor.role}</p>
                        <p className="text-[11px] text-[#9a9a9a] leading-tight">{advisor.credentials}</p>
                      </div>
                    </div>

                    {/* Rating & Stats Strip */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center gap-1.5 text-[#ffb829]">
                        <Star className="w-3.5 h-3.5 fill-[#ffb829]" />
                        <span className="font-semibold">{advisor.rating}</span>
                        <span className="text-[#9a9a9a]">({advisor.sessionsCount} sessions)</span>
                      </div>
                      <span className="text-[#15846e] font-semibold uppercase text-[10px] tracking-wider">
                        Verified
                      </span>
                    </div>

                    {/* Featured Offering Box */}
                    <div className="space-y-2 p-4 rounded-xl border border-white/5 bg-black/40">
                      <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold block">
                        Headline 1:1 Session
                      </span>
                      <h4 className="text-sm font-medium text-white">{advisor.headlineSession}</h4>
                      <div className="flex items-center justify-between pt-2 text-xs">
                        <span className="text-[#9a9a9a] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {advisor.duration}
                        </span>
                        <span className="text-white font-semibold text-sm">{advisor.price}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {(advisor.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-[#bdbdbd] border border-white/5 uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Link
                      to={`/mentor/${advisor.id}`}
                      className="w-full py-3 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-sm shadow-[#8052ff]/20"
                    >
                      <span>View Profile & Book</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 4: The 1:1 Experience (How Suggest Key Works)
           ========================================================================= */}
        <section id="how-it-works" className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            align="center"
            eyebrow="The Protocol"
            title="How Suggest Key works"
            description="A frictionless, private pipeline from initial crossroad definition to tangible action roadmap."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="p-8 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-6 relative flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-light text-[#9a9a9a]/40">{s.step}</span>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed font-light">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: Verification Rigor & Safety
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#15846e] font-semibold block">
                Zero Tolerance for Unqualified Advice
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-normal text-white tracking-[-0.03em]">
                Every single advisor undergoes manual credential verification.
              </h2>
              <p className="text-base text-[#9a9a9a] font-light leading-relaxed">
                Across Relationship, Career, and Mental Health, state licenses, postgraduate degrees, and verified tenure are audited by our operations team before an offering can ever be published.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#15846e]/10 text-[#15846e] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Identity & Employment Audit</h4>
                    <p className="text-xs text-[#9a9a9a]">Government ID, company verification, and verified tenure.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#15846e]/10 text-[#15846e] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">License & Degree Verification</h4>
                    <p className="text-xs text-[#9a9a9a]">Mandatory document review for clinical, psychological, and executive fields.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#15846e]/10 text-[#15846e] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Anonymous Seeker Mode</h4>
                    <p className="text-xs text-[#9a9a9a]">Seek advice under an alias with full privacy protection.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Visual Graphic */}
            <div className="p-8 sm:p-10 rounded-[28px] border border-white/10 bg-white/[0.02] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#8052ff]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Advisory Audit Protocols
                  </span>
                </div>
                <Badge variant="verdant">{advisorySegments.length} Active Segments</Badge>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {advisorySegments.map((seg) => (
                  <div key={seg.id} className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                    <span className="text-[#9a9a9a]">{seg.name}</span>
                    <span className="text-[#15846e]">Board License Verified</span>
                  </div>
                ))}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-[#9a9a9a]">Participant Chat</span>
                  <span className="text-[#8052ff]">Encrypted 1:1 RLS Gated</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: Seeker Testimonials (from real reviews)
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            align="center"
            eyebrow="Seeker Experiences"
            title="Real decisions made with verified counsel"
            description="Hear from professionals and partners who unlocked momentum with Suggest Key."
          />

          <div className="p-8 rounded-[24px] border border-dashed border-white/10 text-center text-xs text-[#9a9a9a]">
            No testimonials yet. Reviews from verified seekers will appear here after completed sessions.
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: Monolithic Bottom CTA
           ========================================================================= */}
        <section className="py-32 px-6 max-w-[1280px] mx-auto text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <span className="text-xs uppercase tracking-widest text-[#8052ff] font-semibold block">
              Begin Your 1:1 Journey
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] font-normal text-white tracking-[-0.03em]">
              Cross your bridge with someone who has already been there.
            </h2>
            <p className="text-base sm:text-lg text-[#9a9a9a] font-light max-w-xl mx-auto">
              Explore verified advisors across Relationship, Career, and Mental Health. Schedule a confidential session today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-4 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#8052ff]/25"
              >
                Find an Advisor
              </Link>
              <Link
                to="/signup?role=mentor"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200"
              >
                Apply as an Advisor
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          FOOTER: Monolithic Subtle Design Token Hierarchy
         ========================================================================= */}
      <footer className="border-t border-white/5 bg-black py-16 px-6">
        <div className="max-w-[1280px] mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[1px]">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#8052ff] rounded-xs rotate-45" />
                  </div>
                </div>
                <span className="font-medium text-base text-white">Suggest Key</span>
              </div>
              <p className="text-xs text-[#9a9a9a] max-w-sm font-light leading-relaxed">
                Direct 1:1 human intelligence for critical Relationship, Career, and Mental Health crossroads.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-white font-semibold block">Segments</span>
              <ul className="space-y-2 text-xs text-[#9a9a9a]">
                {advisorySegments.map((seg) => (
                  <li key={seg.id}>
                    <Link to={`/explore?segment=${seg.slug}`} className="hover:text-white transition-colors">
                      {seg.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/discover" className="hover:text-white transition-colors">
                    Explore All Advisors
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-white font-semibold block">Legal & Privacy</span>
              <ul className="space-y-2 text-xs text-[#9a9a9a]">
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Credential Verification Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Seeker Confidentiality & RLS
                  </span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9a9a9a]">
            <div>© 2026 Suggest Key Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Pure Void Aesthetic</span>
              <span>•</span>
              <span>100% Audited</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
