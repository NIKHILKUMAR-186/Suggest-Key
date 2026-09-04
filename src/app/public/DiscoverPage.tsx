import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { DomainChooserPage } from '../../components/discovery/DomainChooserPage';
import { ProblemMatchPage } from '../../components/discovery/ProblemMatchPage';
import { DomainAdvisorsPage } from '../../components/discovery/DomainAdvisorsPage';
import {
  DiscoveryDomain,
  DiscoveryAdvisor,
  DiscoveryFilter,
  DiscoveryFilterOptions,
  ProblemMatchResult,
} from '../../domains/discovery/discovery.types';
import { DiscoveryService } from '../../domains/discovery/DiscoveryService';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { LoadingState, EmptyState, ErrorState } from '../../components/ui/StateComponents';
import { Filter, Star, RotateCcw } from 'lucide-react';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'chooser' }
  | { kind: 'matching' }
  | { kind: 'domain'; slug: string }
  | { kind: 'problem-result'; match: ProblemMatchResult }
  | { kind: 'error'; message: string };

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [domains, setDomains] = useState<DiscoveryDomain[]>([]);
  const [advisors, setAdvisors] = useState<DiscoveryAdvisor[]>([]);
  const [filters, setFilters] = useState<DiscoveryFilter>({});
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<DiscoveryFilterOptions | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setView({
        kind: 'error',
        message:
          'Discovery requires a live Supabase connection. Please configure your environment to browse verified advisors.',
      });
      return;
    }
    DiscoveryService.getDomains()
      .then((list) => {
        if (!mounted) return;
        setDomains(list);
        const slug = searchParams.get('segment') || searchParams.get('category');
        const problem = searchParams.get('problem');
        if (slug && isValidSlug(slug, list)) {
          setActiveSlug(slug);
          setView({ kind: 'domain', slug });
        } else if (problem && problem.trim().length >= 8) {
          runProblemMatch(problem.trim(), list);
        } else {
          setView({ kind: 'chooser' });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setView({
          kind: 'error',
          message:
            err?.message ||
            'We could not load advisory domains right now. Please retry shortly.',
        });
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view.kind === 'loading' || view.kind === 'error') return;
    if (view.kind === 'chooser' || view.kind === 'matching') return;

    let cancelled = false;
    setLoadingAdvisors(true);

    const load = async () => {
      try {
        let list: DiscoveryAdvisor[] = [];
        if (view.kind === 'domain') {
          list = await DiscoveryService.getAdvisorsForDomain(view.slug, filters);
          setActiveSlug(view.slug);
        } else if (view.kind === 'problem-result') {
          list = DiscoveryService.applyAdvisorFilters(
            view.match.advisors,
            filters,
            view.match.primaryDomain?.slug
          );
          setActiveSlug(view.match.primaryDomain?.slug || null);
        }
        if (!cancelled) {
          setAdvisors(list);
          setFilterOptions(DiscoveryService.computeFilterOptions(list));
          setLoadingAdvisors(false);
        }
      } catch (err) {
        if (!cancelled) {
          setAdvisors([]);
          setLoadingAdvisors(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.kind === 'domain' ? (view as any).slug : null, view.kind, filters]);

  function isValidSlug(slug: string, list: DiscoveryDomain[]): boolean {
    return list.some((d) => d.slug === slug && d.is_active);
  }

  function runProblemMatch(problem: string, list?: DiscoveryDomain[]) {
    setView({ kind: 'matching' });
    DiscoveryService.matchProblem(problem)
      .then((match) => {
        setView({ kind: 'problem-result', match });
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('problem', problem);
          next.delete('segment');
          next.delete('category');
          return next;
        });
      })
      .catch((err) => {
        setView({
          kind: 'error',
          message:
            err?.message ||
            'We could not interpret your challenge right now. Please try again.',
        });
      });
  }

  function handleChooseDomain(slug: string) {
    if (!isValidSlug(slug, domains)) {
      setView({
        kind: 'error',
        message: 'That advisory domain is not currently active. Please choose another.',
      });
      return;
    }
    setActiveSlug(slug);
    setFilters({});
    setView({ kind: 'domain', slug });
    setSearchParams({ segment: slug });
  }

  function handleProblemSubmit(problem: string) {
    runProblemMatch(problem);
  }

  function handleBackToChooser() {
    setView({ kind: 'chooser' });
    setSearchParams({});
    setActiveSlug(null);
    setAdvisors([]);
    setFilters({});
  }

  function handleChangeFilter<K extends keyof DiscoveryFilter>(
    key: K,
    value: DiscoveryFilter[K] | undefined
  ) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '' || value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  function handleClearFilters() {
    setFilters({});
  }

  function handleSearchChange(query: string) {
    setFilters((prev) => {
      const next = { ...prev };
      if (!query) delete next.searchQuery;
      else next.searchQuery = query;
      return next;
    });
  }

  const currentDomain = useMemo(
    () => domains.find((d) => d.slug === activeSlug) || null,
    [domains, activeSlug]
  );

  const headerTitle = (() => {
    if (view.kind === 'chooser') return 'Choose your advisory path';
    if (view.kind === 'matching') return 'Finding the right specialists';
    if (view.kind === 'problem-result') return 'Advisors matched to your challenge';
    if (view.kind === 'domain') return currentDomain?.name || 'Advisors';
    return 'Discovery';
  })();

  const showFilters = view.kind === 'domain' || view.kind === 'problem-result';

  const filtersBar = showFilters ? (
    <FilterPanel
      filterOptions={filterOptions}
      filters={filters}
      onChange={handleChangeFilter}
      onClear={handleClearFilters}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col">
      <PublicNav />

      <main className="w-full pt-24 pb-20 px-6 max-w-[1280px] mx-auto flex-1 space-y-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02]">
              <Star className="w-3.5 h-3.5 text-[#8052ff]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9a9a9a]">
                Seeker Discovery
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-normal text-white tracking-tight">
              {headerTitle}
            </h1>
          </div>
          {view.kind !== 'chooser' && view.kind !== 'loading' && (
            <button
              onClick={handleBackToChooser}
              className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white"
            >
              ← All domains
            </button>
          )}
        </div>

        {view.kind === 'loading' && (
          <LoadingState message="Loading advisory domains..." />
        )}

        {view.kind === 'error' && (
          <ErrorState
            title="Discovery is temporarily unavailable"
            description={view.message}
            actionLabel="Retry"
            onAction={handleBackToChooser}
          />
        )}

        {view.kind === 'chooser' && (
          <DomainChooserPage
            domains={domains}
            loading={false}
            onChooseDomain={handleChooseDomain}
            onProblemSubmit={handleProblemSubmit}
          />
        )}

        {view.kind === 'matching' && (
          <LoadingState message="Interpreting your challenge..." />
        )}

        {view.kind === 'problem-result' && (
          <>
            <ProblemMatchPage
              match={view.match}
              onChooseDomain={handleChooseDomain}
              onBack={handleBackToChooser}
              onBookSession={() => {
                /* handled inside filtered grid below */
              }}
            />

            {filtersBar}

            <ProblemMatchedGrid advisors={advisors} loading={loadingAdvisors} />
          </>
        )}

        {view.kind === 'domain' && currentDomain && (
          <DomainAdvisorsPage
            domain={currentDomain}
            domains={domains}
            selectedCategory={currentDomain.slug}
            searchQuery={filters.searchQuery || ''}
            onCategoryChange={handleChooseDomain}
            onBookSession={() => {}}
            onBack={handleBackToChooser}
            onSearchChange={handleSearchChange}
            externalFiltersBar={filtersBar}
          />
        )}
      </main>

      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#9a9a9a]">
        <div className="max-w-[1280px] mx-auto">
          Suggest Key • Live Supabase Discovery • Audited 1:1 Human Intelligence Directory
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// Filter Panel
// ============================================================
function FilterPanel({
  filterOptions,
  filters,
  onChange,
  onClear,
}: {
  filterOptions: DiscoveryFilterOptions | null;
  filters: DiscoveryFilter;
  onChange: <K extends keyof DiscoveryFilter>(
    key: K,
    value: DiscoveryFilter[K] | undefined
  ) => void;
  onClear: () => void;
}) {
  if (!filterOptions) return null;

  const activeFilters =
    (filters.minRating ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.experience ? 1 : 0) +
    (filters.credentials ? 1 : 0) +
    (filters.focusArea ? 1 : 0);

  return (
    <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.015] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white">
          <Filter className="w-3.5 h-3.5 text-[#8052ff]" />
          <span>Refine results</span>
          {activeFilters > 0 && (
            <span className="text-[10px] text-[#9a9a9a]">({activeFilters} active)</span>
          )}
        </div>
        {activeFilters > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] text-[#8052ff] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {filterOptions.availableFocusAreas.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] block">
              Focus area
            </span>
            <select
              value={filters.focusArea || ''}
              onChange={(e) => onChange('focusArea', e.target.value || undefined)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8052ff]"
            >
              <option value="">All focus areas</option>
              {filterOptions.availableFocusAreas.map((fa) => (
                <option key={fa} value={fa}>
                  {fa}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] block">
            Experience
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onChange('experience', undefined)}
              className={`px-2.5 py-1 rounded-full text-[10px] border ${
                !filters.experience
                  ? 'border-[#8052ff] bg-[#8052ff]/10 text-white'
                  : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
              }`}
            >
              Any
            </button>
            {filterOptions.experienceOptions.map((yrs) => (
              <button
                key={yrs}
                onClick={() => onChange('experience', yrs)}
                className={`px-2.5 py-1 rounded-full text-[10px] border ${
                  filters.experience === yrs
                    ? 'border-[#8052ff] bg-[#8052ff]/10 text-white'
                    : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                }`}
              >
                {yrs}+ yrs
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] block">
            Minimum rating
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onChange('minRating', undefined)}
              className={`px-2.5 py-1 rounded-full text-[10px] border ${
                !filters.minRating
                  ? 'border-[#8052ff] bg-[#8052ff]/10 text-white'
                  : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
              }`}
            >
              Any
            </button>
            {filterOptions.ratingOptions.map((r) => (
              <button
                key={r}
                onClick={() => onChange('minRating', r)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border ${
                  filters.minRating === r
                    ? 'border-[#8052ff] bg-[#8052ff]/10 text-white'
                    : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 fill-[#ffb829] text-[#ffb829]" />
                {r}+
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] block">
              Maximum price
            </span>
            {filters.maxPrice && (
              <button
                onClick={() => onChange('maxPrice', undefined)}
                className="text-[10px] text-[#8052ff] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="range"
            min={filterOptions.priceRange.min}
            max={filterOptions.priceRange.max}
            step={500}
            value={filters.maxPrice || filterOptions.priceRange.max}
            onChange={(e) =>
              onChange(
                'maxPrice',
                Number(e.target.value) >= filterOptions.priceRange.max
                  ? undefined
                  : Number(e.target.value)
              )
            }
            className="w-full accent-[#8052ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#9a9a9a]">
            <span>₹{filterOptions.priceRange.min.toLocaleString('en-IN')}</span>
            <span className="text-white">
              {filters.maxPrice
                ? `≤ ₹${filters.maxPrice.toLocaleString('en-IN')}`
                : `Up to ₹${filterOptions.priceRange.max.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <label className="inline-flex items-center gap-2 text-xs text-[#bdbdbd] cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.credentials}
            onChange={(e) =>
              onChange('credentials', e.target.checked || undefined)
            }
            className="rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0"
          />
          <span>Verified credentials only</span>
        </label>
      </div>
    </div>
  );
}

// ============================================================
// Problem-matched advisor grid (filterable)
// ============================================================
function ProblemMatchedGrid({
  advisors,
  loading,
}: {
  advisors: DiscoveryAdvisor[];
  loading: boolean;
}) {
  if (loading) {
    return <LoadingState message="Loading matched advisors..." />;
  }
  if (advisors.length === 0) {
    return (
      <EmptyState
        title="No advisors match all your filters"
        description="Try removing a filter or pick a domain directly to explore the full directory."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {advisors.map((adv) => (
        <MatchedAdvisorRow key={adv.id} advisor={adv} />
      ))}
    </div>
  );
}

function MatchedAdvisorRow({ advisor }: { advisor: DiscoveryAdvisor }) {
  const name = advisor.full_name || advisor.profile?.full_name || 'Advisor';
  const avatar = advisor.avatar_url || advisor.profile?.avatar_url;
  const primaryGig = (advisor.gigs || [])[0];

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] hover:border-[#8052ff]/40 p-5 flex flex-col gap-4 transition-all">
      <div className="flex items-start gap-3.5">
        <img
          src={
            avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          }
          alt={name}
          className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
        />
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-medium text-white line-clamp-1">{name}</h3>
          <p className="text-xs text-[#9a9a9a] line-clamp-1">
            {advisor.headline || 'Verified Specialist'}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#9a9a9a]">
            <Star className="w-3 h-3 fill-[#ffb829] text-[#ffb829]" />
            <span className="font-semibold text-white">
              {(advisor.rating || 5).toFixed(1)}
            </span>
            <span>•</span>
            <span>{advisor.review_count || 0} reviews</span>
            <span>•</span>
            <span>{advisor.experience_years || 0}+ yrs</span>
          </div>
        </div>
      </div>

      {advisor.specialties && advisor.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {advisor.specialties.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-[10px] text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[11px] text-[#9a9a9a]">
          {primaryGig
            ? `${primaryGig.duration_minutes} min • ₹${(
                primaryGig.price_inr || 0
              ).toLocaleString('en-IN')}`
            : 'View profile for offerings'}
        </span>
        <Link
          to={`/mentor/${advisor.id}`}
          className="text-[11px] text-[#8052ff] hover:underline"
        >
          View profile →
        </Link>
      </div>
    </div>
  );
}