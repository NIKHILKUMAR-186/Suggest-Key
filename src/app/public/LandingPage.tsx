import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorySegment, AdvisorySegmentSlug } from '../../domains/segment/SegmentTypes';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { SegmentService } from '../../domains/segment/SegmentService';
import { JourneyPath } from '../../components/visual/JourneyPath';
import { useReveal } from '../../components/visual/Reveal';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Search,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Users,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Activity,
  Briefcase,
  Heart,
  Brain,
  Compass,
  LockKeyhole,
  BadgeCheck,
  X,
} from 'lucide-react';

type IconType = React.ElementType;

interface AdvisorRow {
  id: string;
  name: string;
  role: string;
  credentials: string;
  category: string;
  rating: number;
  sessionsCount: number;
  avatarUrl: string;
  livedExperience: string;
  tags: string[];
  verified: boolean;
  fitLine: string;
}

interface Stats {
  advisors: number;
  sessions: number;
  segments: number;
  rating: number;
}

interface PathOption {
  id: string;
  label: string;
  description: string;
  slug: AdvisorySegmentSlug | null;
  icon: IconType;
  accent: string;
  questions: string[];
}

interface Suggestion {
  label: string;
  query: string;
  slug: AdvisorySegmentSlug | null;
  icon: IconType;
}

interface Understanding {
  label: string;
  description: string;
  slug: AdvisorySegmentSlug | null;
}

type JourneyStage = 'uncertainty' | 'understanding' | 'experience' | 'conversation' | 'clarity';

const SUGGESTIONS: Suggestion[] = [
  { label: "I'm thinking about leaving my job", query: 'Career transition', slug: AdvisorySegmentSlug.Career, icon: Briefcase },
  { label: "I'm stuck in my career", query: 'Stuck in my career', slug: AdvisorySegmentSlug.Career, icon: Briefcase },
  { label: "I'm unsure about my relationship", query: 'Relationship uncertainty', slug: AdvisorySegmentSlug.Relationship, icon: Heart },
  { label: "I'm considering a major decision", query: 'Major life decision', slug: null, icon: Compass },
  { label: "I don't know what to do next", query: 'What should I do next', slug: null, icon: HelpCircle },
];

const GENERIC_QUESTIONS: Record<string, string[]> = {
  career: ['Switching fields', 'Feeling stuck', 'Want to grow', 'Not sure'],
  relationship: ['Communication', 'Trust', 'Moving forward', 'Boundaries'],
  'mental-health': ['Stress', 'Anxiety', 'Burnout', 'Clarity'],
  decision: ['Weighing options', 'Need a second perspective', 'Not sure where to start'],
  starting: ['Validating an idea', 'Need early feedback', 'Planning next steps'],
  unsure: ['Exploring options', 'Need a sounding board', 'Not sure what fits'],
};

const AdvisorCard: React.FC<{ adv: AdvisorRow }> = ({ adv }) => {
  const [avatarErr, setAvatarErr] = useState(false);
  return (
    <div className="group relative p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#8052ff]/45 hover:-translate-y-1 hover:shadow-[0_16px_48px_-16px_rgba(128,82,255,0.35)] transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#8052ff]/60 to-transparent" />
      </div>
      <div className="relative">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
              {adv.avatarUrl && !avatarErr ? (
                <img src={adv.avatarUrl} alt={adv.name} loading="lazy" onError={() => setAvatarErr(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <span className="text-lg font-medium text-white">{adv.name.charAt(0)}</span>
              )}
            </div>
            {adv.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0e0e0e] border-2 border-[#15846e] flex items-center justify-center shadow-md">
                <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white truncate group-hover:text-[#a07cff] transition-colors">{adv.name}</h3>
            </div>
            <p className="text-xs text-[#a07cff] font-medium truncate mt-0.5">{adv.role}</p>
            <p className="text-[11px] text-[#9a9a9a] mt-0.5">{adv.credentials}</p>
          </div>
        </div>

        <p className="text-sm text-[#c4c4c4] font-light leading-relaxed line-clamp-2 mb-4">{adv.livedExperience}</p>

        {adv.fitLine && (
          <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#2dd4bf] font-semibold">
            {adv.fitLine}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(adv.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-[#bdbdbd] border border-white/5 uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-[11px] text-[#9a9a9a]">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#ffb829] fill-[#ffb829]" />
              <span className="text-white font-medium">{adv.rating.toFixed(1)}</span>
            </span>
            <span>{adv.sessionsCount} sessions</span>
          </div>
          <Link to={`/mentor/${adv.id}`} className="text-[11px] uppercase tracking-wider text-white font-semibold inline-flex items-center gap-1.5 group/btn hover:text-[#a07cff] transition-colors">
            View profile
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [matching, setMatching] = useState(false);
  const [stage, setStage] = useState<JourneyStage>('uncertainty');

  const [advisors, setAdvisors] = useState<AdvisorRow[]>([]);
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [stats, setStats] = useState<Stats>({ advisors: 0, sessions: 0, segments: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [activeDiff, setActiveDiff] = useState<'generic' | 'key'>('key');
  const [activePath, setActivePath] = useState<string | null>(null);
  const [verProgress, setVerProgress] = useState(0);
  const [howProgress, setHowProgress] = useState(0);

  const heroEyebrow = useReveal<HTMLDivElement>(0);
  const heroHead = useReveal<HTMLDivElement>(90);
  const heroSearch = useReveal<HTMLDivElement>(180);
  const pathsHead = useReveal<HTMLDivElement>(0);
  const diffHead = useReveal<HTMLDivElement>(0);
  const diffCard = useReveal<HTMLDivElement>(120);
  const advHead = useReveal<HTMLDivElement>(0);
  const verHead = useReveal<HTMLDivElement>(0);
  const verSteps = useReveal<HTMLDivElement>(120);
  const howHead = useReveal<HTMLDivElement>(0);
  const expHead = useReveal<HTMLDivElement>(0);
  const ctaBox = useReveal<HTMLDivElement>(0);

  const verRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [segs, advsResp] = await Promise.all([SegmentService.getActiveSegments(), AdvisorService.getPaginatedAdvisors({ limit: 4, page: 1 })]);
        if (!mounted) return;
        setSegments(segs);
        const rows: AdvisorRow[] = advsResp.advisors.map((a) => ({
          id: a.id,
          name: a.profile?.full_name || 'Advisor',
          role: a.headline?.split('|')[0]?.trim() || 'Advisor',
          credentials: `${a.experience_years ?? 0}+ yrs`,
          category: a.verified_categories?.[0] || 'General',
          rating: a.rating,
          sessionsCount: a.review_count,
          avatarUrl: a.profile?.avatar_url || '',
          livedExperience: (a.bio || '').slice(0, 120) || 'Experience matched to your situation.',
          tags: a.specialties || [],
          verified: a.verification_status === 'approved',
          fitLine: (a.specialties?.length ? `Good fit if you're exploring ${a.specialties.slice(0, 2).join(' · ')}` : `Good fit for ${a.verified_categories?.[0] || 'your situation'}`),
        }));
        setAdvisors(rows);

        const all = await AdvisorService.getAllAdvisors();
        if (!mounted) return;
        const totalSessions = all.reduce((s, a) => s + (a.review_count || 0), 0);
        const avgRating = all.length ? all.reduce((s, a) => s + (a.rating || 0), 0) / all.length : 0;
        setStats({
          advisors: all.length,
          sessions: totalSessions,
          segments: segs.length,
          rating: Math.round(avgRating * 10) / 10,
        });
      } catch (e) {
        console.error('Landing data error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const verEl = verRef.current;
    const howEl = howRef.current;
    if (!verEl && !howEl) return;
    let raf = 0;
    const tick = () => {
      const vh = window.innerHeight;
      if (verEl) {
        const rect = verEl.getBoundingClientRect();
        const start = vh * 0.85;
        const end = vh * 0.35;
        const p = rect.top > start ? 0 : rect.bottom < end ? 1 : Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
        setVerProgress(p);
      }
      if (howEl) {
        const rect = howEl.getBoundingClientRect();
        const start = vh * 0.85;
        const end = vh * 0.35;
        const p = rect.top > start ? 0 : rect.bottom < end ? 1 : Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
        setHowProgress(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const segmentMap = useMemo(() => {
    const m: Record<string, AdvisorySegment> = {};
    segments.forEach((s) => { m[s.slug] = s; });
    return m;
  }, [segments]);

  const pathOptions = useMemo<PathOption[]>(() => {
    const career = segmentMap[AdvisorySegmentSlug.Career];
    const relationship = segmentMap[AdvisorySegmentSlug.Relationship];
    const mental = segmentMap[AdvisorySegmentSlug.MentalHealth];
    return [
      { id: 'career', label: career?.name || 'My career', description: career?.short_description || 'Growth, switch, or what\'s next?', slug: AdvisorySegmentSlug.Career, icon: Briefcase, accent: '#8052ff', questions: GENERIC_QUESTIONS.career },
      { id: 'relationship', label: relationship?.name || 'My relationship', description: relationship?.short_description || 'Support, clarity, moving forward', slug: AdvisorySegmentSlug.Relationship, icon: Heart, accent: '#ffb829', questions: GENERIC_QUESTIONS.relationship },
      { id: 'mental-health', label: mental?.name || 'My mental health', description: mental?.short_description || 'Feel better, think clearer', slug: AdvisorySegmentSlug.MentalHealth, icon: Brain, accent: '#15846e', questions: GENERIC_QUESTIONS['mental-health'] },
      { id: 'decision', label: 'A major decision', description: 'When it\'s not obvious', slug: null, icon: HelpCircle, accent: '#22d3ee', questions: GENERIC_QUESTIONS.decision },
      { id: 'starting', label: 'Starting something', description: 'Ideas, validation, next steps', slug: null, icon: Sparkles, accent: '#8052ff', questions: GENERIC_QUESTIONS.starting },
      { id: 'unsure', label: 'I don\'t know yet', description: 'Help me figure it out', slug: null, icon: Compass, accent: '#9a9a9a', questions: GENERIC_QUESTIONS.unsure },
    ];
  }, [segmentMap]);

  const visibleSuggestions = useMemo(() => {
    if (!searchFocused) return [];
    if (query.trim()) return SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()) || s.query.toLowerCase().includes(query.toLowerCase()));
    return SUGGESTIONS;
  }, [searchFocused, query]);

  const chooseSuggestion = (s: Suggestion) => {
    setQuery(s.query);
    setSelectedSituation(s.query);
    setUnderstanding({ label: s.label, description: `People who have ${s.query.toLowerCase()}.`, slug: s.slug });
    setStage('understanding');
  };

  const inferDomain = (q: string): Understanding => {
    const lower = q.toLowerCase();
    if (lower.includes('career') || lower.includes('job') || lower.includes('promotion') || lower.includes('switch')) {
      return { label: 'Career transition', description: 'People who have switched careers or navigated promotion roadmaps.', slug: AdvisorySegmentSlug.Career };
    }
    if (lower.includes('relationship') || lower.includes('partner') || lower.includes('marriage') || lower.includes('communication')) {
      return { label: 'Relationship clarity', description: 'People who have worked through communication, trust, or partnership dynamics.', slug: AdvisorySegmentSlug.Relationship };
    }
    if (lower.includes('mental') || lower.includes('anxious') || lower.includes('stress') || lower.includes('therapy') || lower.includes('burnout')) {
      return { label: 'Mental health support', description: 'People who have managed stress, anxiety, or life transitions.', slug: AdvisorySegmentSlug.MentalHealth };
    }
    return { label: 'A useful next step', description: 'People who have faced similar uncertainty and found clarity.', slug: null };
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate('/discover');
      return;
    }
    setMatching(true);
    setStage('conversation');
    navigate(`/discover?problem=${encodeURIComponent(q)}`);
  };

  const stageConfig: Record<JourneyStage, { label: string; active: number }> = {
    uncertainty: { label: 'UNCERTAINTY', active: 0 },
    understanding: { label: 'UNDERSTANDING', active: 1 },
    experience: { label: 'LIVED EXPERIENCE', active: 2 },
    conversation: { label: 'CONVERSATION', active: 3 },
    clarity: { label: 'CLARITY', active: 4 },
  };

  const activeVerStep = Math.min(3, Math.floor(verProgress * 4));
  const activeHowStep = Math.min(3, Math.floor(howProgress * 4));

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-clip flex flex-col relative">
      <JourneyPath />
      <PublicNav />

      <a href="#main-content" className="skip-link">Skip to content</a>

      <main id="main-content" className="relative z-10 flex-1 pt-20">

        <section className="relative px-6 pt-16 pb-14 sm:pt-24 sm:pb-20" aria-labelledby="hero-heading">
          <div className="max-w-[1280px] mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
              <div className="max-w-2xl">
                <div ref={heroEyebrow}>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.04] mb-7">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d6d6de]">Direct 1:1 Human Intelligence</span>
                  </div>
                </div>

                <div ref={heroHead}>
                  <h1 id="hero-heading" className="text-[42px] sm:text-5xl md:text-[68px] leading-[1.02] tracking-[-0.035em] font-normal text-[#f5f4fa] mb-6">
                    People who have crossed<br />
                    the bridge you stand <span className="text-[#a07cff]">before.</span>
                  </h1>
                  <p className="text-base sm:text-lg text-[#c2c2cc] font-light leading-relaxed max-w-xl mb-9">
                    When facing critical crossroads in Relationship, Career, or Mental Health, skip the generic advice. Talk directly to verified advisors who have walked the path.
                  </p>
                </div>

                <div ref={heroSearch}>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#a07cff] font-semibold mb-2">What are you navigating?</p>
                  <form onSubmit={onSearch} role="search" className="flex flex-col sm:flex-row gap-3 max-w-xl mb-5 relative">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a07cff]" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuery(v);
                          if (v.trim().length >= 3) {
                            setUnderstanding(inferDomain(v));
                            setStage('understanding');
                          } else {
                            setUnderstanding(null);
                            setStage('uncertainty');
                          }
                          setSelectedSituation(null);
                        }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                        placeholder="What are you navigating? e.g. Career transition"
                        aria-label="What are you navigating?"
                        className="w-full h-[52px] pl-11 pr-4 rounded-full bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-[#8f8f9a] focus:outline-none focus:border-[#8052ff]/80 focus:ring-2 focus:ring-[#8052ff]/30 backdrop-blur-md"
                      />
                    </div>
                    <button type="submit" className="h-[52px] px-7 bg-[#8052ff] hover:bg-[#6c3df0] hover:-translate-y-0.5 text-white rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_8px_32px_-8px_rgba(128,82,255,0.6)]">
                      {matching ? 'Understanding…' : 'Find my advisor →'}
                    </button>

                    {searchFocused && visibleSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-white/15 bg-[#0a0a0c] backdrop-blur-md shadow-2xl overflow-hidden">
                    {visibleSuggestions.map((s) => (
                      <button key={s.query} type="button" onClick={(e) => { e.preventDefault(); chooseSuggestion(s); }} className="w-full text-left px-4 py-3 text-sm text-[#c2c2cc] hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-3">
                        <s.icon className="w-4 h-4 text-[#a07cff]" />
                        <span className="font-light">{s.label}</span>
                      </button>
                    ))}
                      </div>
                    )}
                  </form>

                  {understanding && query && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xl mb-5">
                      <div className="w-8 h-8 rounded-xl bg-[#8052ff]/10 border border-[#8052ff]/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-[#a07cff]" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a9aa6] font-semibold mb-1">You might be looking for</p>
                        <p className="text-sm text-white font-medium mb-1">{understanding.label}</p>
                        <p className="text-[12px] text-[#9a9a9a] font-light">{understanding.description}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a8a96] font-semibold mb-2">Popular paths</p>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {segments.slice(0, 3).map((seg) => (
                      <button key={seg.id} onClick={() => navigate(`/discover?segment=${seg.slug}`)} className="text-[11px] px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.04] text-[#c8c8d2] hover:text-white hover:border-[#8052ff]/50 transition-all uppercase tracking-[0.12em]">
                        {seg.name}
                      </button>
                    ))}
                    <button onClick={() => navigate('/discover')} className="text-[11px] px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.04] text-[#c8c8d2] hover:text-white hover:border-[#8052ff]/50 transition-all uppercase tracking-[0.12em]">
                      Life Decisions
                    </button>
                  </div>

                  <button onClick={() => navigate('/discover')} className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors inline-flex items-center gap-2 group">
                    <HelpCircle className="w-4 h-4" />
                    Can&apos;t decide which to choose?
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="relative hidden lg:flex items-center justify-center" aria-hidden="true">
                <div className="relative w-full max-w-[420px] aspect-square">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(128,82,255,0.16),transparent_65%)] blur-2xl" />
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    <defs>
                      <linearGradient id="heroPath" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8052ff" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#8052ff" stopOpacity="0.12" />
                      </linearGradient>
                    </defs>
                    <path d="M 60 330 C 120 290, 150 340, 200 260 C 250 180, 280 240, 340 80" fill="none" stroke="url(#heroPath)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
                    {[0, 1, 2, 3, 4].map((i) => {
                      const active = i <= stageConfig[stage].active;
                      return (
                        <circle key={i} cx={[60, 200, 280, 340, 360][i]} cy={[330, 260, 200, 140, 80][i]} r={active ? 6 : 4} fill={active ? '#c9b3ff' : '#a07cff'} opacity={active ? 0.95 : 0.45} filter={active ? 'url(#jp-crisp)' : ''} />
                      );
                    })}
                    <text x={stageConfig[stage].label === 'CLARITY' ? 340 : 60} y={stageConfig[stage].label === 'CLARITY' ? 60 : 360} textAnchor="middle" fill="#a07cff" fontSize="11" fontWeight="500" opacity="0.8" letterSpacing="0.5">{stageConfig[stage].label}</text>
                  </svg>
                  <span className="absolute left-[8%] top-[62%] rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8f8f9a]">Experience matters</span>
                  <span className="absolute left-[42%] top-[46%] rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8f8f9a]">Guidance today</span>
                  <span className="absolute right-[4%] top-[8%] rounded-full border border-[#8052ff]/30 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#a07cff]">Clarity tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Platform metrics" className="px-6">
          <div className="max-w-[1280px] mx-auto rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-md px-6 py-8 sm:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Advisors', value: loading ? '…' : `${stats.advisors}+`, icon: Users },
                { label: 'Reviews', value: loading ? '…' : `${stats.sessions}+`, icon: MessageCircle },
                { label: 'Segments', value: loading ? '…' : `${stats.segments}`, icon: Activity },
                { label: 'Avg rating', value: loading ? '…' : `${stats.rating}`, icon: TrendingUp },
              ].map((item, idx) => {
                const itemClass = idx > 0 ? 'md:border-l md:border-white/10 md:pl-8' : '';
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`space-y-1.5 ${itemClass}`}>
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#a07cff]" />
                      <div className="text-[28px] sm:text-[32px] font-medium tracking-tight text-white">{item.value}</div>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#9a9aa6]">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pt-16 sm:pt-20 pb-4" aria-labelledby="paths-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
              <div className="lg:sticky lg:top-28" ref={pathsHead}>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-3">Advisory Paths</span>
                <h2 id="paths-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-3">You don&apos;t need to know who to talk to.</h2>
                <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed max-w-md">Just tell us what&apos;s stuck. We&apos;ll help you find the right person based on real experience, not just job titles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pathOptions.map((opt) => {
                  const Icon = opt.icon;
                  const open = activePath === opt.id;
                  return (
                    <div key={opt.id} className={`group rounded-3xl border transition-all duration-300 relative overflow-hidden ${open ? 'border-[#8052ff]/60 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                      <button onClick={() => setActivePath(open ? null : opt.id)} aria-expanded={open} className="w-full text-left p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${opt.accent}15`, border: `1px solid ${opt.accent}30` }}>
                            <Icon className="w-5 h-5" style={{ color: opt.accent }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white mb-1 group-hover:text-[#a07cff] transition-colors">{opt.label}</div>
                            <div className="text-[12px] text-[#9a9a9a] font-light leading-relaxed">{opt.description}</div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-[#9a9a9a] transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {open && (
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a9aa6] font-semibold mb-3">What are you facing?</p>
                            <div className="flex flex-wrap gap-2">
                              {opt.questions.map((q) => (
                                <button key={q} onClick={() => { const p = opt.slug ? `/discover?segment=${opt.slug}&problem=${encodeURIComponent(q)}` : `/discover?problem=${encodeURIComponent(q)}`; navigate(p); }} className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-[#c2c2cc] hover:text-white hover:border-[#8052ff]/50 transition-all">
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pt-14 sm:pt-16 pb-4" aria-labelledby="diff-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center">
              <div ref={diffHead}>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-3">The Difference</span>
                <h2 id="diff-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-4">The right person isn&apos;t a category.</h2>
                <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed mb-8 max-w-md">You aren&apos;t really looking for a &quot;career mentor.&quot; You&apos;re looking for someone who has already faced something similar.</p>

                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 mb-6" role="tablist" aria-label="Compare search approaches">
                  <button role="tab" aria-selected={activeDiff === 'generic'} onClick={() => setActiveDiff('generic')} className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] font-semibold transition-all ${activeDiff === 'generic' ? 'bg-white/10 text-white' : 'text-[#8f8f9a] hover:text-white'}`}>Generic search</button>
                  <button role="tab" aria-selected={activeDiff === 'key'} onClick={() => setActiveDiff('key')} className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] font-semibold transition-all ${activeDiff === 'key' ? 'bg-[#8052ff] text-white shadow-[0_4px_20px_-4px_rgba(128,82,255,0.6)]' : 'text-[#8f8f9a] hover:text-white'}`}>Suggest Key</button>
                </div>

                <div className="min-h-[96px]">
                  {activeDiff === 'generic' ? (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><span className="text-[#8f8f9a] text-xs font-bold">✕</span></div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Generic search</h3>
                        <p className="text-[13px] text-[#9a9aa6] font-light leading-relaxed max-w-sm">Career Mentor · Life Coach · Therapist · Business Advisor — browse titles, filter by credentials, hope for the best.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#8052ff]/10 border border-[#8052ff]/30 flex items-center justify-center shrink-0"><span className="text-[#a07cff] text-xs font-bold">→</span></div>
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Suggest Key</h3>
                        <p className="text-[13px] text-[#c2c2cc] font-light leading-relaxed max-w-sm">Real people · real experience · matched to your situation · meaningful conversations · perspective from someone who&apos;s been there.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div ref={diffCard} className="relative">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-7 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#8052ff]/10 border border-[#8052ff]/30 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-[#a07cff]" /></div>
                    <div>
                      <div className="text-sm font-medium text-white">Matched by lived experience</div>
                      <div className="text-[11px] text-[#9a9aa6]">Not by job title</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      'Crossed the same career transition',
                      'Understands the specific uncertainty',
                      'Has already walked a similar bridge',
                      'Verified credentials + real reviews',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-[#c2c2cc]">
                        <CheckCircle2 className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                        <span className="font-light">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-sm font-semibold text-[#a07cff]">Match perspective.<br/>Not just titles.</p>
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-[#8052ff]/5 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pt-14 sm:pt-16 pb-4" aria-labelledby="advisors-heading">
          <div className="max-w-[1280px] mx-auto" ref={advHead}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
              <div className="max-w-2xl">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-3">Featured Advisors</span>
                <h2 id="advisors-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-3">People worth 45 minutes of your undivided focus.</h2>
                <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed">Verified advisors. Real experience. Meaningful conversations.</p>
              </div>
              <Link to="/explore" className="text-xs uppercase tracking-wider text-[#8052ff] hover:text-[#a07cff] font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0">Browse full directory <ArrowUpRight className="w-4 h-4" /></Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 rounded-3xl border border-white/10 bg-white/[0.015] animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-1/3" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-10">
                {advisors.map((adv) => (
                  <AdvisorCard key={adv.id} adv={adv} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="px-6 pt-14 sm:pt-16 pb-4" aria-labelledby="trust-heading">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
              <div ref={verHead}>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#2dd4bf] font-semibold block mb-3">Trust & Verification</span>
                <h2 id="trust-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-4">Every single advisor undergoes manual credential verification.</h2>
                <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed max-w-md">Across Relationship, Career, and Mental Health, licenses, degrees, and verified tenure are reviewed by our operations team before an advisor can publish a session.</p>
              </div>

              <div ref={verRef} className="relative rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <div className="absolute left-[33px] sm:left-[41px] top-9 bottom-9 w-px bg-white/10" aria-hidden="true" />
                <div className="absolute left-[33px] sm:left-[41px] top-9 w-[2px] rounded-full bg-gradient-to-b from-[#2dd4bf] via-[#8052ff] to-[#a07cff] shadow-[0_0_12px_rgba(128,82,255,0.5)]" style={{ height: `${Math.min(100, verProgress * 100 + 8)}%` }} aria-hidden="true" />
                {[
                  { num: '01', title: 'Identity & Employment Audit', desc: 'Government ID, company verification, and verified tenure.' },
                  { num: '02', title: 'License & Degree Verification', desc: 'Mandatory document review for clinical, psychological, and executive fields.' },
                  { num: '03', title: 'Experience Validation', desc: 'Career history and advisory experience cross-checked.' },
                  { num: '04', title: 'Ongoing Quality Checks', desc: 'Post-session reviews and periodic re-verification.' },
                ].map((step, i) => (
                  <div key={step.num} className="relative flex gap-5 py-5 first:pt-0 last:pb-0">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${i <= activeVerStep ? 'border-[#8052ff] bg-[#8052ff]/20 text-[#a07cff]' : 'border-white/10 bg-[#050507] text-[#9a9a9a]'}`}>
                        <span className="text-[10px] font-bold">{step.num}</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <h3 className="text-sm font-medium text-white mb-1">{step.title}</h3>
                      <p className="text-[13px] text-[#9a9aa6] font-light leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 pt-14 sm:pt-16 pb-4" aria-labelledby="how-heading">
          <div className="max-w-[1280px] mx-auto" ref={howRef}>
            <div className="max-w-2xl mb-10">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-3">How It Works</span>
              <h2 id="how-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-3">From uncertainty → clarity</h2>
              <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed">A simple, private process to help you find the right advisor.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#8052ff]/30 via-[#8052ff]/10 to-[#8052ff]/30">
                <div className="h-full bg-[#8052ff]/70 transition-all duration-300" style={{ width: `${howProgress * 100}%` }} />
              </div>

              {[
                { num: '01', title: 'Tell us what\'s happening.', desc: 'Share your situation in a few words.', icon: MessageCircle },
                { num: '02', title: 'We understand your needs.', desc: 'Your situation is matched with relevant advisors.', icon: Activity },
                { num: '03', title: 'Choose a 45-minute session.', desc: 'Pick a time that works for you.', icon: Clock },
                { num: '04', title: 'Have a real conversation.', desc: 'Get clarity and a meaningful next step.', icon: CheckCircle2 },
              ].map((step, i) => {
                const Icon = step.icon;
                const active = i <= activeHowStep;
                return (
                  <div key={step.num} className={`relative text-center sm:text-left transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 relative transition-all duration-500 ${active ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-white/20' : 'bg-white/[0.02] border-white/10'}`}>
                        <Icon className={`w-7 h-7 transition-colors duration-500 ${active ? 'text-[#a07cff]' : 'text-[#9a9a9a]'}`} />
                        <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors duration-500 ${active ? 'bg-[#8052ff] text-white' : 'bg-[#0a0a0c] text-[#9a9a9a] border border-white/10'}`}>{step.num}</span>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-2">{step.title}</h3>
                      <p className="text-xs text-[#9a9a9a] font-light leading-relaxed max-w-[220px]">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pt-14 sm:pt-16 pb-4" aria-labelledby="exp-heading">
          <div className="max-w-[1280px] mx-auto text-center" ref={expHead}>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-3">Seeker Experiences</span>
            <h2 id="exp-heading" className="text-heading text-[#f5f4fa] tracking-[-0.03em] mb-4">Real decisions made with verified counsel.</h2>
            <p className="text-[15px] text-[#c2c2cc] font-light leading-relaxed max-w-xl mx-auto mb-10">Reviews from verified seekers will appear here after completed sessions. No curated quotes. No fabricated statistics.</p>
            <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-md">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-white/15 text-[11px] text-[#9a9aa6] uppercase tracking-[0.14em]">
                <Sparkles className="w-3.5 h-3.5 text-[#a07cff]" />
                No testimonials yet
              </div>
              <p className="text-[12px] text-[#8a8a96] uppercase tracking-[0.14em]">Built for decisions that don&apos;t fit into a search bar.</p>
            </div>
          </div>
        </section>

        <section className="px-6 pt-16 sm:pt-20 pb-16 sm:pb-24" aria-labelledby="cta-heading">
          <div className="max-w-[1280px] mx-auto text-center relative" ref={ctaBox}>
            <div className="relative rounded-[32px] border border-white/10 bg-white/[0.025] backdrop-blur-md px-6 py-14 sm:py-20 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_100%,rgba(128,82,255,0.16),transparent_70%)]" />
              </div>

              <div className="relative">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#a07cff] font-semibold block mb-5">Begin Your Journey</span>
                <h2 id="cta-heading" className="text-3xl sm:text-4xl md:text-[52px] leading-[1.08] tracking-[-0.03em] text-[#f5f4fa] mb-5 max-w-3xl mx-auto">Cross your bridge with someone who has already been there.</h2>
                <p className="text-[15px] sm:text-base text-[#c2c2cc] font-light max-w-xl mx-auto mb-10">Explore verified advisors across Relationship, Career, and Mental Health.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/explore" className="w-full sm:w-auto px-10 py-4 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_8px_32px_-8px_rgba(128,82,255,0.6)] hover:-translate-y-0.5">Find an Advisor</Link>
                  <Link to="/signup?role=mentor" className="w-full sm:w-auto px-10 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/15 rounded-full text-xs font-bold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5">Apply as an Advisor</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#050507] py-16 px-6 relative z-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[1.5px]">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#8052ff] rotate-45" />
                  </div>
                </div>
                <span className="font-medium text-base text-white">Suggest Key</span>
              </Link>
              <p className="text-[11px] text-[#9a9a9a] font-extralight leading-relaxed max-w-xs">Direct 1:1 human intelligence for critical Relationship, Career, and Mental Health crossroads.</p>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">Explore</span>
              <ul className="space-y-2 text-[11px] text-[#9a9a9a] font-extralight">
                <li><Link to="/explore" className="hover:text-white transition-colors">Advisors</Link></li>
                <li><Link to="/discover" className="hover:text-white transition-colors">Discovery</Link></li>
                <li><Link to="/explore?segment=relationship" className="hover:text-white transition-colors">Relationship</Link></li>
                <li><Link to="/explore?segment=career" className="hover:text-white transition-colors">Career</Link></li>
                <li><Link to="/explore?segment=mental-health" className="hover:text-white transition-colors">Mental Health</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">For Advisors</span>
              <ul className="space-y-2 text-[11px] text-[#9a9a9a] font-extralight">
                <li><Link to="/signup?role=mentor" className="hover:text-white transition-colors">Apply as an Advisor</Link></li>
                <li><span className="text-[#9a9a9a]">Advisor Guidelines</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">Legal</span>
              <ul className="space-y-2 text-[11px] text-[#9a9a9a] font-extralight">
                <li><span className="text-[#9a9a9a]">Privacy Policy</span></li>
                <li><span className="text-[#9a9a9a]">Terms of Service</span></li>
                <li><span className="text-[#9a9a9a]">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9a9a9a] uppercase tracking-wider">
            <div>© 2026 Suggest Key Inc. All rights reserved.</div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
              Verification-first
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
