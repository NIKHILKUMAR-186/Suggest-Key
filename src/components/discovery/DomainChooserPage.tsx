import React from 'react';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { ChevronRight, HelpCircle, Users } from 'lucide-react';
import { DiscoveryDomain } from '../../domains/discovery/discovery.types';

export interface DomainChooserPageProps {
  domains: DiscoveryDomain[];
  loading?: boolean;
  onChooseDomain: (slug: string) => void;
  onProblemSubmit: (problem: string) => void;
}

export const DomainChooserPage: React.FC<DomainChooserPageProps> = ({
  domains,
  loading = false,
  onChooseDomain,
  onProblemSubmit,
}) => {
  const [problem, setProblem] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const trimmed = problem.trim();
    if (!trimmed || trimmed.length < 8) return;
    setSubmitting(true);
    await onProblemSubmit(trimmed);
    setSubmitting(false);
  };

  const charCount = problem.length;
  const valid = problem.trim().length >= 8 && charCount <= 320;

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-normal text-white tracking-tight">
          What do you need guidance on?
        </h1>
        <p className="text-sm text-[#9a9a9a] max-w-xl leading-relaxed">
          Browse an advisory domain below, or tell us your challenge and we'll route
          you to the most relevant verified specialists.
        </p>
      </div>

      {/* 1. Advisory domain cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-white/10 bg-white/[0.02] h-[220px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {domains.map((d) => (
            <DomainCard key={d.id} domain={d} onChoose={onChooseDomain} />
          ))}
        </div>
      )}

      {/* 2. Problem-input pathway */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#8052ff]" />
          <h2 className="text-lg font-medium text-white">Can't decide which to choose?</h2>
        </div>
        <p className="text-xs text-[#9a9a9a]">
          Describe your situation in your own words and we'll interpret your intent and
          surface the right advisors.
        </p>
        <Textarea
          label="Your challenge"
          placeholder="e.g. I'm struggling with my manager and don't know whether I should switch jobs..."
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={4}
          helperText={`${charCount}/320 characters`}
          error={problem.trim().length > 0 && problem.trim().length < 8 ? 'Please share at least 8 characters' : undefined}
        />
        <Button variant="primary" onClick={handleSubmit} disabled={!valid || submitting}>
          {submitting ? 'Matching advisors…' : 'Find My Match'}
        </Button>
      </div>
    </div>
  );
};

interface DomainCardProps {
  domain: DiscoveryDomain;
  onChoose: (slug: string) => void;
}

const DomainCard: React.FC<DomainCardProps> = ({ domain, onChoose }) => {
  const accent = domain.accent || '#8052ff';
  return (
    <button
      onClick={() => onChoose(domain.slug)}
      className="group rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] hover:border-[#8052ff]/40 p-7 flex flex-col text-left transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          style={{ color: accent }}
        >
          <DynamicIcon name={domain.icon || 'Sparkles'} className="w-5 h-5" />
        </div>
        <Badge color={accent}>{domain.badge || `${domain.name} Specialists`}</Badge>
      </div>

      <div className="mt-5 space-y-2 flex-1">
        <h3 className="text-xl font-medium text-white group-hover:text-[#8052ff] transition-colors">
          {domain.name}
        </h3>
        <p className="text-xs text-[#9a9a9a] leading-relaxed line-clamp-3 min-h-[3.25rem]">
          {domain.shortDescription || domain.description}
        </p>
      </div>

      {domain.focusAreas && domain.focusAreas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {domain.focusAreas.map((fa, i) => (
            <span
              key={i}
              className="text-[10px] text-[#9a9a9a] px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
            >
              {fa}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
          <Users className="w-3.5 h-3.5 text-[#707070]" />
          <span>{domain.advisorCount} verified advisors</span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#8052ff] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
};
