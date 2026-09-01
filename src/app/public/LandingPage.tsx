import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { ConstellationCanvas } from '../../components/visual/ConstellationCanvas';
import { Badge } from '../../components/ui/Badge';
import { Tag } from '../../components/ui/Tag';
import { SectionHeader } from '../../components/ui/Headers';
import { AdvisorySegmentSlug } from '../../domains/segment/SegmentTypes';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Compass,
  FileCheck2,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Heart,
  Briefcase,
  Brain,
} from 'lucide-react';

const FEATURED_ADVISORS = [
  {
    id: 'dr-alistair-chen',
    name: 'Dr. Alistair Chen, LMFT',
    role: 'Relationship Advisor',
    credentials: 'Ph.D. Stanford • Gottman Method Level 3 Certified • 15 yrs practice',
    category: 'Relationship',
    categorySlug: 'relationship',
    rating: 4.99,
    sessionsCount: 62,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    headlineSession: 'High-Stakes Partnership Conflict Calibration & De-escalation',
    duration: '45 mins',
    price: '₹4,500',
    tags: ['Gottman Method', 'Partnership Alignment', 'Family Systems'],
    verified: true,
  },
  {
    id: 'marcus-thorne',
    name: 'Marcus Thorne',
    role: 'Career Advisor',
    credentials: 'Ex-Google Staff Eng • CMU Distributed Systems • 16 yrs leadership',
    category: 'Career',
    categorySlug: 'career',
    rating: 5.0,
    sessionsCount: 41,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    headlineSession: 'Staff+ Engineering Promotion & Organizational Influence',
    duration: '45 mins',
    price: '₹4,200',
    tags: ['Staff+ Trajectory', 'System Architecture', 'RFC Strategy'],
    verified: true,
  },
  {
    id: 'evelyn-vasquez',
    name: 'Dr. Evelyn Vasquez',
    role: 'Mental Health Advisor',
    credentials: 'Ph.D. Columbia University • Licensed Clinical Psychologist • 14 yrs',
    category: 'Mental Health',
    categorySlug: 'mental-health',
    rating: 4.98,
    sessionsCount: 54,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=240&auto=format&fit=crop&q=80',
    headlineSession: 'Executive Crossroads & Burnout Diagnostics',
    duration: '45 mins',
    price: '₹3,500',
    tags: ['Burnout Diagnostics', 'Cognitive Protocols', 'Decision Fatigue'],
    verified: true,
  },
];

const ADVISORY_SEGMENTS = [
  {
    id: AdvisorySegmentSlug.Relationship,
    title: 'Relationship Advisory',
    description: 'Partnership calibration, interpersonal dynamics, family systems & high-stakes conflict de-escalation.',
    count: 'Audited Relationship Specialists',
    accent: 'amber' as const,
    badgeText: 'LMFT & Gottman Verified',
    icon: Heart,
    slug: AdvisorySegmentSlug.Relationship,
  },
  {
    id: AdvisorySegmentSlug.Career,
    title: 'Career Advisory',
    description: 'Executive leadership, Staff+ engineering trajectories, high-stakes compensation negotiation & strategic pivots.',
    count: 'Audited Career Specialists',
    accent: 'iris' as const,
    badgeText: 'Executive Track Audited',
    icon: Briefcase,
    slug: AdvisorySegmentSlug.Career,
  },
  {
    id: AdvisorySegmentSlug.MentalHealth,
    title: 'Mental Health Advisory',
    description: 'Clinical psychology, executive burnout diagnostics, neuro-resilience protocols & cognitive restructuring.',
    count: 'Licensed Clinical Psychologists',
    accent: 'verdant' as const,
    badgeText: 'Mandatory Clinical Audit',
    icon: Brain,
    slug: AdvisorySegmentSlug.MentalHealth,
  },
];

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

const TESTIMONIALS = [
  {
    quote:
      'Dr. Vasquez cut through 6 months of mental fog in 45 minutes. Her clinical grounding made every minute actionable. I walked away with clarity on my executive exit roadmap.',
    author: 'Ananya S.',
    title: 'VP of Product, FinTech',
    session: 'Mental Health • Burnout Diagnostics',
  },
  {
    quote:
      'Marcus helped me structure my Staff+ promotion packet and navigate cross-team architectural alignment. I was promoted to Principal Engineer the following cycle.',
    author: 'Kavita Sundaram',
    title: 'Principal Engineer, Distributed Systems',
    session: 'Career • Staff+ Strategy',
  },
  {
    quote:
      'Dr. Chen transformed our communication dynamics in two sessions. His Gottman-backed framework gave us the exact language to stop escalating high-stress arguments.',
    author: 'Karan & Ritu M.',
    title: 'Founding Partners',
    session: 'Relationship • Conflict Calibration',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchIntent, setSearchIntent] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchIntent.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchIntent.trim())}`);
    } else {
      navigate('/explore');
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
            <h1 className="text-display font-normal text-white max-w-2xl tracking-tight leading-[0.92]">
              People who have crossed the bridge you stand before.
            </h1>

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

            {/* Platform Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-4xl w-full border-t border-white/10 mt-6">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-white">3 Segments</div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Relationship • Career • Mental Health</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#8052ff]">100%</div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Audited Credentials</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#15846e]">680+</div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Sessions Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-[#ffb829]">4.98 ★</div>
                <div className="text-xs uppercase tracking-wider text-[#9a9a9a]">Average Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: Choose Your Advisory Path (Exact 3 Segments)
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            eyebrow="Advisory System"
            title="Choose Your Advisory Path"
            description="We focus strictly on the three foundational pillars of human performance and well-being. Each segment is governed by rigorous verification standards."
            action={
              <Link
                to="/explore"
                className="text-xs uppercase tracking-wider text-[#8052ff] hover:text-[#a07cff] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Explore all advisors</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ADVISORY_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              return (
                <Link
                  key={seg.id}
                  to={`/explore?segment=${seg.slug}`}
                  className="p-8 rounded-[28px] border border-white/10 hover:border-[#8052ff]/50 bg-white/[0.015] hover:bg-white/[0.035] transition-all duration-300 flex flex-col justify-between space-y-8 group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8052ff] group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant={seg.accent}>{seg.badgeText}</Badge>
                    </div>
                    <div className="space-y-2 pt-2">
                      <h3 className="text-2xl font-medium text-white group-hover:text-[#8052ff] transition-colors">
                        {seg.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#9a9a9a] leading-relaxed font-light">
                        {seg.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-[#9a9a9a]">
                    <span className="font-light">{seg.count}</span>
                    <div className="flex items-center gap-1 font-semibold uppercase tracking-wider text-white group-hover:text-[#8052ff] transition-colors">
                      <span>Explore</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {FEATURED_ADVISORS.map((advisor) => (
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
                    to={`/advisors/${advisor.id}`}
                    className="w-full py-3 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-sm shadow-[#8052ff]/20"
                  >
                    <span>View Profile & Book</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
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
                <Badge variant="verdant">3 Active Segments</Badge>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-[#9a9a9a]">Relationship: LMFT / Gottman</span>
                  <span className="text-[#15846e]">Board License Verified</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-[#9a9a9a]">Career: Staff+ / Executive</span>
                  <span className="text-white">Tenure & Track Record Audited</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-[#9a9a9a]">Mental Health: Clinical / Psy.D</span>
                  <span className="text-[#15846e]">State Medical Board Checked</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-[#9a9a9a]">Participant Chat</span>
                  <span className="text-[#8052ff]">Encrypted 1:1 RLS Gated</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: Seeker Testimonials
           ========================================================================= */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto space-y-16 border-b border-white/5">
          <SectionHeader
            align="center"
            eyebrow="Seeker Experiences"
            title="Real decisions made with verified counsel"
            description="Hear from professionals and partners who unlocked momentum with Suggest Key."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#ffb829]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#ffb829]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#bdbdbd] font-light leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>
                <div className="space-y-1 pt-4 border-t border-white/5">
                  <div className="text-sm font-medium text-white">{t.author}</div>
                  <div className="text-xs text-[#9a9a9a]">{t.title}</div>
                  <div className="text-[11px] text-[#8052ff] uppercase tracking-wider pt-1">{t.session}</div>
                </div>
              </div>
            ))}
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
                <li>
                  <Link to={`/explore?segment=${AdvisorySegmentSlug.Relationship}`} className="hover:text-white transition-colors">
                    Relationship Advisory
                  </Link>
                </li>
                <li>
                  <Link to={`/explore?segment=${AdvisorySegmentSlug.Career}`} className="hover:text-white transition-colors">
                    Career Advisory
                  </Link>
                </li>
                <li>
                  <Link to={`/explore?segment=${AdvisorySegmentSlug.MentalHealth}`} className="hover:text-white transition-colors">
                    Mental Health Advisory
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="hover:text-white transition-colors">
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
