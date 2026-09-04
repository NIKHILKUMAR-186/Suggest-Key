import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Sparkles,
  Calendar,
  ChevronRight,
  HelpCircle,
  Users,
  Tag,
} from 'lucide-react';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/StateComponents';
import { Profile, Gig } from '../../lib/supabase/types';
import {
  ProblemMatchResult,
  DiscoveryAdvisor,
  SuggestedDomain,
} from '../../domains/discovery/discovery.types';

export interface ProblemMatchPageProps {
  match: ProblemMatchResult;
  onChooseDomain: (slug: string) => void;
  onBack: () => void;
  onBookSession: (advisor: DiscoveryAdvisor, gig: Gig) => void;
}

export const ProblemMatchPage: React.FC<ProblemMatchPageProps> = ({
  match,
  onChooseDomain,
  onBack,
  onBookSession,
}) => {
  const primary = match.primaryDomain;
  const confidencePct = Math.round((match.confidence || 0) * 100);
  const showDomainChips = match.isUncertain && match.suggestedDomains.length > 0;

  return (
    <div className="space-y-10">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/5 text-[#9a9a9a] hover:text-white flex items-center justify-center transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl md:text-2xl font-normal text-white tracking-tight">
          Advisors matched to your challenge
        </h1>
      </div>

      {/* Intent Interpretation */}
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.035] to-transparent p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#8052ff]" />
          <h2 className="text-base font-medium text-white">How we read your challenge</h2>
        </div>

        <p className="text-sm text-[#d1d1d6] leading-relaxed max-w-2xl">
          {match.intent}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          {primary && (
            <Badge color={primary.slug === 'career' ? '#15846e' : primary.slug === 'mental-health' ? '#ec4899' : '#ff4757'}>
              {primary.name}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8052ff]" />
            <span>Confidence</span>
            <span className="font-semibold text-white">{confidencePct}%</span>
          </div>
        </div>

        {showDomainChips && (
          <div className="pt-2">
            <p className="text-xs text-[#9a9a9a] mb-2">
              We found signals across multiple domains. You can also explore them directly:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.suggestedDomains.map((d) => (
                <DomainChip key={d.slug} domain={d} onSelect={onChooseDomain} />
              ))}
            </div>
          </div>
        )}

        {match.focusAreas && match.focusAreas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <Tag className="w-3.5 h-3.5 text-[#9a9a9a]" />
            {match.focusAreas.map((fa, i) => (
              <span
                key={i}
                className="text-[10px] text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
              >
                {fa}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Matched Advisors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Recommended specialists</h2>
          <span className="text-xs text-[#9a9a9a]">
            {match.advisors.length} advisor{match.advisors.length === 1 ? '' : 's'} available
          </span>
        </div>

        {match.advisors.length === 0 ? (
          <EmptyState
            title="No specialists matched yet"
            description="We're expanding coverage. Try rephrasing or browse a domain directly."
            actionLabel="Back to domains"
            onAction={onBack}
            icon={<HelpCircle className="w-6 h-6" />}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {match.advisors.map((advisor) => (
              <MatchedAdvisorCard
                key={advisor.id}
                advisor={advisor}
                matchScore={advisor.matchScore || 0}
                matchedFocusAreas={advisor.matchedFocusAreas || []}
                onBookSession={onBookSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DomainChipProps {
  domain: SuggestedDomain;
  onSelect: (slug: string) => void;
}

const DomainChip: React.FC<DomainChipProps> = ({ domain, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(domain.slug)}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-[#8052ff]/40 hover:bg-[#8052ff]/10 text-xs text-[#bdbdbd] hover:text-white transition-all"
    >
      <DynamicIcon name={domainSlugIcon(domain.slug)} className="w-3.5 h-3.5" />
      <span>{domain.name}</span>
      <ChevronRight className="w-3 h-3 text-[#8052ff]" />
    </button>
  );
};

function domainSlugIcon(slug: string): string {
  switch (slug) {
    case 'relationship':
      return 'Heart';
    case 'career':
      return 'Briefcase';
    case 'mental-health':
      return 'Brain';
    default:
      return 'Sparkles';
  }
}

interface MatchedAdvisorCardProps {
  advisor: DiscoveryAdvisor;
  matchScore: number;
  matchedFocusAreas: string[];
  onBookSession: (advisor: DiscoveryAdvisor, gig: Gig) => void;
}

const MatchedAdvisorCard: React.FC<MatchedAdvisorCardProps> = ({
  advisor,
  matchScore,
  matchedFocusAreas,
  onBookSession,
}) => {
  const primaryGig = (advisor.gigs || [])[0];
  const scorePct = Math.round(matchScore * 100);
  const name = advisor.full_name || advisor.profile?.full_name || 'Advisor';
  const avatar = advisor.avatar_url || advisor.profile?.avatar_url;
  const accent = '#8052ff';

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] hover:border-[#8052ff]/40 p-6 flex flex-col gap-5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={name}
              className="w-13 h-13 rounded-full object-cover border border-white/10"
            />
            {advisor.verification_status === 'approved' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#15846e]" />
              </div>
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-medium text-white line-clamp-1">{name}</h3>
            <p className="text-xs text-[#9a9a9a] line-clamp-1">{advisor.headline || 'Verified Specialist'}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
              <div className="flex items-center gap-1 text-[#ffb829]">
                <Star className="w-3 h-3 fill-[#ffb829]" />
                <span className="font-semibold text-white">{(advisor.rating || 5).toFixed(1)}</span>
              </div>
              <span>•</span>
              <span>{advisor.review_count || 0} reviews</span>
              <span>•</span>
              <span>{advisor.experience_years || 0}+ yrs</span>
            </div>
          </div>
        </div>

        <div
          className="text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap"
          style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}15` }}
        >
          {scorePct}% match
        </div>
      </div>

      {matchedFocusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchedFocusAreas.map((fa, i) => (
            <span
              key={i}
              className="text-[10px] text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
            >
              {fa}
            </span>
          ))}
        </div>
      )}

      {primaryGig ? (
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
            <Users className="w-3.5 h-3.5 text-[#707070]" />
            <span>{primaryGig.duration_minutes} mins</span>
            <span>•</span>
            <span>₹{(primaryGig.price_inr || 0).toLocaleString('en-IN')}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBookSession(advisor, primaryGig)}
            className="bg-[#8052ff] hover:bg-[#6c3df0]"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book
          </Button>
        </div>
      ) : (
        <Link
          to={`/mentor/${advisor.id}`}
          className="mt-auto pt-4 border-t border-white/5 text-xs text-[#8052ff] hover:underline"
        >
          View profile →
        </Link>
      )}
    </div>
  );
};
