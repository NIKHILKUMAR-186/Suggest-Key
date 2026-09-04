import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { SegmentIntroduction } from '../segment/SegmentIntroduction';
import { PaginatedAdvisorCarousel } from '../advisor/PaginatedAdvisorCarousel';
import { DiscoveryDomain } from '../../domains/discovery/discovery.types';
import { Gig, Offering } from '../../lib/supabase/types';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';

export interface DomainAdvisorsPageProps {
  domain: DiscoveryDomain;
  domains: DiscoveryDomain[];
  selectedCategory: string;
  searchQuery: string;
  onCategoryChange: (categoryId: string) => void;
  onBookSession: (advisor: AdvisorDetail, gig: Gig, offering?: Offering | null) => void;
  onBack: () => void;
  onSearchChange?: (query: string) => void;
  externalFiltersBar?: React.ReactNode;
}

export const DomainAdvisorsPage: React.FC<DomainAdvisorsPageProps> = ({
  domain,
  domains,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onBookSession,
  onBack,
  onSearchChange,
  externalFiltersBar,
}) => {
  const [search, setSearch] = useState(searchQuery || '');
  useEffect(() => {
    setSearch(searchQuery || '');
  }, [searchQuery]);

  function handleSearch(value: string) {
    setSearch(value);
    if (onSearchChange) onSearchChange(value);
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/5 text-[#9a9a9a] hover:text-white flex items-center justify-center transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl md:text-2xl font-normal text-white tracking-tight">
          {domain?.name || 'Advisors'}
        </h1>
      </div>

      <SegmentIntroduction segment={domain as unknown as any} showTransitionBanner={true} />

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => onCategoryChange(d.slug)}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-all
              ${
                selectedCategory === d.slug
                  ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                  : 'text-[#9a9a9a] hover:text-white border border-white/5 hover:bg-white/5'
              }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#9a9a9a] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${domain?.name || 'advisors'} by topic, skill, or name...`}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff] transition-all"
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#707070] hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {externalFiltersBar}

      <div className="space-y-3 pt-2">
        <PaginatedAdvisorCarousel
          key={selectedCategory}
          segment={selectedCategory}
          searchQuery={search}
          title={`Featured ${domain?.name || selectedCategory} Specialists`}
          subtitle={domain?.shortDescription || `Top rated mentors verified in ${domain?.name || selectedCategory}.`}
          badge={domain?.badge || 'Verified Domain Specialists'}
          onBookSession={onBookSession}
        />
      </div>
    </div>
  );
};
