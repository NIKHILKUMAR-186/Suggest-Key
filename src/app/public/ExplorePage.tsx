import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorEditorialCard } from '../../components/advisor/AdvisorEditorialCard';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { Category } from '../../lib/supabase/types';
import { AdvisorDetail } from '../../domains/advisor/seedData';
import { AdvisorySegmentSlug } from '../../domains/segment/SegmentTypes';
import {
  Search,
  Filter,
  Brain,
  Briefcase,
  Heart,
  Compass,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const ICON_MAP: Record<string, any> = {
  Brain,
  Briefcase,
  Heart,
  Compass,
};

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSegment = searchParams.get('segment') || searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<Category[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSegment, setSelectedSegment] = useState<string>(initialSegment);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [cats, advs] = await Promise.all([
        AdvisorService.getCategories(),
        AdvisorService.getAdvisors(),
      ]);
      setCategories(cats);
      setAdvisors(advs);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Update selected segment if URL changes
  useEffect(() => {
    const urlSegment = searchParams.get('segment') || searchParams.get('category');
    if (urlSegment && urlSegment !== selectedSegment) {
      setSelectedSegment(urlSegment);
    }
  }, [searchParams]);

  // Filtered advisors
  const filteredAdvisors = advisors.filter((adv) => {
    // Segment match (dynamically resolved from advisory_segments table)
    if (selectedSegment !== 'all') {
      const matchSegment =
        adv.segment_id === selectedSegment ||
        (adv.verified_categories || []).includes(selectedSegment) ||
        (adv.gigs || []).some((g) => g.segment_id === selectedSegment);
      if (!matchSegment) return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inName = (adv.profile?.full_name || adv.full_name || '').toLowerCase().includes(q);
      const inHeadline = (adv.headline || '').toLowerCase().includes(q);
      const inBio = (adv.bio || '').toLowerCase().includes(q);
      const inRole = (adv.role_title || '').toLowerCase().includes(q);
      const inSegment = (adv.segment_name || '').toLowerCase().includes(q);
      const inSpecialties = (adv.specialties || []).some((s) => (s || '').toLowerCase().includes(q));
      const inGigs = (adv.gigs || []).some(
        (g) =>
          (g.title || '').toLowerCase().includes(q) ||
          (g.description || '').toLowerCase().includes(q) ||
          (g.deliverables || []).some((d) => (d || '').toLowerCase().includes(q))
      );
      if (!inName && !inHeadline && !inBio && !inRole && !inSegment && !inSpecialties && !inGigs) {
        return false;
      }
    }

    // Rating filter
    if (minRating > 0 && (adv.rating || 5) < minRating) {
      return false;
    }

    // Max price filter (checks if at least one gig satisfies budget)
    if (adv.gigs && adv.gigs.length > 0 && !adv.gigs.some((g) => g.price_inr <= maxPrice)) {
      return false;
    }

    // Verified only filter
    if (verifiedOnly && adv.verification_status !== 'approved') {
      return false;
    }

    return true;
  });

  const handleSegmentSelect = (slug: string) => {
    setSelectedSegment(slug);
    if (slug === 'all') {
      searchParams.delete('segment');
      searchParams.delete('category');
    } else {
      searchParams.set('segment', slug);
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSegment('all');
    setMinRating(0);
    setMaxPrice(10000);
    setVerifiedOnly(false);
    setSearchParams({});
  };

  const activeCategoryInfo = categories.find((c) => c.slug === selectedSegment || c.id === selectedSegment);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between">
      <PublicNav />

      <main className="w-full pt-28 pb-24 px-6 max-w-[1280px] mx-auto flex-1 space-y-12">
        {/* Editorial Directory Header */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                  Audited Advisory Segments Directory
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.03em] text-white">
                Explore Verified 1:1 Advisors
              </h1>
              <p className="text-sm sm:text-base text-[#9a9a9a] font-light leading-relaxed">
                Connect directly with credential-audited practitioners across our three specialized advisory paths: Relationship, Career, and Mental Health.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="md:hidden px-4 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-wider font-semibold flex items-center gap-2 text-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Primary Category Carousel */}
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by advisory segment, specialty, challenge, or advisor name (e.g. Burnout, Gottman, Staff+ Promotion)..."
                className="w-full px-5 py-4 pl-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#8052ff] text-white placeholder:text-[#9a9a9a]/60 text-sm sm:text-base focus:outline-none transition-all"
              />
              <Search className="w-5 h-5 text-[#8052ff] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9a9a9a] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Three Canonical Advisory Segments Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSegmentSelect('all')}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                  selectedSegment === 'all'
                    ? 'bg-[#8052ff] text-white shadow-sm shadow-[#8052ff]/30'
                    : 'bg-white/5 hover:bg-white/10 text-[#9a9a9a] hover:text-white border border-white/5'
                }`}
              >
                All Advisory Segments ({advisors.length})
              </button>

              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon_name] || Compass;
                const isSelected = selectedSegment === cat.slug || selectedSegment === cat.id;
                const count = advisors.filter(
                  (a) =>
                    a.segment_id === cat.slug ||
                    (a.verified_categories || []).includes(cat.slug) ||
                    (a.gigs || []).some((g) => g.segment_id === cat.id)
                ).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSegmentSelect(cat.slug)}
                    className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#8052ff] text-white shadow-sm shadow-[#8052ff]/30'
                        : 'bg-white/5 hover:bg-white/10 text-[#9a9a9a] hover:text-white border border-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Active Segment Descriptive Strip */}
            {activeCategoryInfo && selectedSegment !== 'all' && (
              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-[#8052ff] font-semibold">
                      Advisory Segment Focus
                    </span>
                    <Badge variant="verdant">Audited Specialists</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-[#bdbdbd] font-light">
                    {activeCategoryInfo.description}
                  </p>
                </div>
                <Link
                  to={`/explore/${activeCategoryInfo.slug}`}
                  className="shrink-0 text-xs text-[#8052ff] hover:underline uppercase tracking-wider font-semibold"
                >
                  View Segment Details →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Directory Layout: Sidebar Controls + Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className={`lg:col-span-3 space-y-6 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
            <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#8052ff]" />
                  Refine Advisors
                </span>
                {(searchQuery || selectedSegment !== 'all' || minRating > 0 || maxPrice < 10000 || verifiedOnly) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11px] text-[#8052ff] hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Segment Radio Selection */}
              <div className="space-y-2.5">
                <span className="text-xs text-[#9a9a9a] block font-medium uppercase tracking-wider">
                  Advisory Segment
                </span>
                <div className="space-y-1.5">
                  <label
                    onClick={() => handleSegmentSelect('all')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedSegment === 'all'
                        ? 'border-[#8052ff] bg-[#8052ff]/10 text-white font-medium'
                        : 'border-white/5 bg-white/[0.02] text-[#9a9a9a] hover:text-white'
                    }`}
                  >
                    <span>All Segments</span>
                    <span>{advisors.length}</span>
                  </label>
                  {categories.map((cat) => {
                    const isSelected = selectedSegment === cat.slug;
                    const count = advisors.filter(
                      (a) =>
                        a.segment_id === cat.slug ||
                        (a.verified_categories || []).includes(cat.slug)
                    ).length;
                    return (
                      <label
                        key={cat.id}
                        onClick={() => handleSegmentSelect(cat.slug)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#8052ff] bg-[#8052ff]/10 text-white font-medium'
                            : 'border-white/5 bg-white/[0.02] text-[#9a9a9a] hover:text-white'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span>{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9a9a9a]">Maximum Session Fee</span>
                  <span className="text-white font-medium">₹{(maxPrice || 10000).toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="10000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#8052ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#9a9a9a]">
                  <span>₹2,000</span>
                  <span>₹10,000+</span>
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs text-[#9a9a9a] block font-medium">Minimum Rating</span>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 4.8, 4.95].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMinRating(val)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        minRating === val
                          ? 'border-[#8052ff] bg-[#8052ff]/10 text-white'
                          : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                      }`}
                    >
                      {val === 0 ? 'Any' : `${val} ★+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Clinical Only Checkbox */}
              <div className="pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 text-xs text-[#bdbdbd] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0"
                  />
                  <span>100% Audited Advisors Only</span>
                </label>
              </div>

              {/* Trust Guarantee Note */}
              <div className="p-4 rounded-xl bg-[#15846e]/10 border border-[#15846e]/20 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-[#15846e] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Credential Guarantee</span>
                </div>
                <p className="text-[11px] text-[#9a9a9a] leading-relaxed">
                  Every advisor's degrees, licenses, and verified employment are audited prior to publication.
                </p>
              </div>
            </div>
          </aside>

          {/* Advisors Editorial Listing */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between text-xs text-[#9a9a9a] pb-2">
              <span>
                Showing <strong className="text-white">{filteredAdvisors.length}</strong> audited specialist{filteredAdvisors.length === 1 ? '' : 's'}
              </span>
              <span className="hidden sm:inline">Sorted by Editorial Relevance & Reviews</span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs uppercase tracking-wider text-[#9a9a9a]">Loading Specialists...</p>
              </div>
            ) : filteredAdvisors.length === 0 ? (
              <div className="p-12 rounded-[28px] border border-white/10 bg-white/[0.015] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 text-[#9a9a9a] mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-white">No matching advisors found</h3>
                <p className="text-xs text-[#9a9a9a] max-w-sm mx-auto">
                  Try broadening your search term or switching to one of our three advisory segments.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAdvisors.map((adv) => (
                  <AdvisorEditorialCard
                    key={adv.id}
                    advisor={adv}
                    categorySlug={selectedSegment !== 'all' ? selectedSegment : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#9a9a9a]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Suggest Key • Audited 1:1 Human Intelligence Directory</span>
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>•</span>
            <Link to={`/explore?segment=${AdvisorySegmentSlug.Relationship}`} className="hover:text-white">Relationship</Link>
            <span>•</span>
            <Link to={`/explore?segment=${AdvisorySegmentSlug.Career}`} className="hover:text-white">Career</Link>
            <span>•</span>
            <Link to={`/explore?segment=${AdvisorySegmentSlug.MentalHealth}`} className="hover:text-white">Mental Health</Link>
            <span>•</span>
            <Link to="/signup?role=mentor" className="hover:text-white">Apply as Advisor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
