import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AdvisorService,
  AdvisorDetail,
  getCredentialsSummary,
} from '../../domains/advisor/AdvisorService';
import { SegmentService } from '../../domains/segment/SegmentService';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import {
  RecommendationEngine,
  RecommendationEntry,
  formatRecommendationScore,
} from '../../lib/recommendations';
import {
  Star,
  ShieldCheck,
  TrendingUp,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { DynamicIcon } from '../common/DynamicIcon';

interface RecommendedAdvisorSectionProps {
  preferredSegmentSlug?: string;
  limit?: number;
}

export const RecommendedAdvisorSection: React.FC<RecommendedAdvisorSectionProps> = ({
  preferredSegmentSlug,
  limit = 6,
}) => {
  const [entries, setEntries] = useState<RecommendationEntry[]>([]);
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const [allAdvisors, segs] = await Promise.all([
          AdvisorService.getAdvisorsWithSegments(),
          SegmentService.getActiveSegments(),
        ]);

        SegmentService.setCachedSegments(segs);

        if (isMounted) {
          setSegments(segs);
          const results = RecommendationEngine.recommend(
            allAdvisors,
            segs,
            {
              preferredSegmentSlug,
              limit,
            }
          );
          setEntries(results);
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
        if (isMounted) setEntries([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [preferredSegmentSlug, limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 mb-3">
          <TrendingUp className="w-5 h-5 text-[#8052ff]" />
          <h2 className="text-lg sm:text-xl font-normal text-white tracking-tight">
            Recommended For You
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-[24px] border border-white/5 bg-white/[0.02] animate-pulse space-y-4 min-h-[240px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-[#8052ff]" />
          <h2 className="text-lg sm:text-xl font-normal text-white tracking-tight">
            Recommended For You
          </h2>
          {preferredSegmentSlug && (
            <span className="text-xs text-[#9a9a9a] uppercase tracking-wider">
              in {preferredSegmentSlug.replace(/-/g, ' ')}
            </span>
          )}
        </div>

        <Link
          to="/seeker/discover"
          className="text-xs text-[#9a9a9a] hover:text-white hover:underline transition-colors flex items-center gap-1"
        >
          View all on Explore
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-xs text-[#707070] max-w-2xl">
        Our algorithm weights verified ratings, review volume, credential
        recency, and segment alignment. Each score is fully transparent —
        hover a card for the full reasoning.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {entries.map((entry) => (
          <RecommendedCard key={entry.advisor.id} entry={entry} segments={segments} />
        ))}
      </div>
    </section>
  );
};

interface RecommendedCardProps {
  entry: RecommendationEntry;
  segments: AdvisorySegment[];
}

const RecommendedCard: React.FC<RecommendedCardProps> = ({ entry, segments }) => {
  const { advisor, score, confidence, reasons } = entry;
  const summary = formatRecommendationScore(entry);
  const creds = getCredentialsSummary(advisor);

  const seg = SegmentService.getCachedSegmentBySlug(
    advisor.segment_id || advisor.verified_categories?.[0] || ''
  );

  const activeSegments = (advisor.mentor_segments || [])
    .filter((ms) => ms.status === 'active')
    .slice(0, 2)
    .map((ms) => {
      const segData =
        ms.segment ||
        (ms.segment_id
          ? SegmentService.getCachedSegmentBySlug(ms.segment_id)
          : null);
      return segData?.name || ms.segment_id || '';
    })
    .filter(Boolean);

  const primaryGig = (advisor.gigs || [])[0];

  return (
    <Link
      to={`/mentor/${advisor.id}`}
      className="group block rounded-[24px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] hover:border-[#8052ff]/40 p-6 transition-all duration-300 relative"
    >
      <div className="space-y-4">
        {/* Score Badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full border"
            style={{
              color: '#8052ff',
              borderColor: '#8052ff40',
              backgroundColor: '#8052ff15',
            }}
          >
            {summary}
          </span>
          <span className="text-[10px] text-[#9a9a9a]">
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>

        {/* Profile Row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
               src={
                advisor.profile?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={advisor.profile?.full_name || 'Advisor'}
              className="w-14 h-14 rounded-[18px] object-cover border border-white/10 group-hover:border-[#8052ff]/50 transition-colors"
            />
            {advisor.verification_status === 'approved' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0e0e0e] border border-[#15846e] flex items-center justify-center text-[#15846e]">
                <ShieldCheck className="w-2.5 h-2.5" />
              </div>
            )}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white group-hover:text-[#8052ff] transition-colors truncate">
               {advisor.profile?.full_name || 'Advisor'}
            </h3>
            <p className="text-xs text-[#9a9a9a] line-clamp-1">
              {advisor.headline}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-[#707070] pt-0.5">
              <div className="flex items-center gap-1 text-[#ffb829]">
                <Star className="w-3 h-3 fill-[#ffb829]" />
                <span className="font-semibold text-white">
                  {(advisor.rating || 5).toFixed(1)}
                </span>
              </div>
              <span>•</span>
              <span>{advisor.review_count || 0} reviews</span>
              <span>•</span>
              <span>{advisor.experience_years || 5}+ yrs</span>
            </div>
          </div>

          {primaryGig && (
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-white">
                ₹{(primaryGig.price_inr || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#707070]">
                {primaryGig.duration_minutes} mins
              </div>
            </div>
          )}
        </div>

        {/* Explanation tooltip area */}
        <div
          className="flex flex-wrap gap-1 text-[10px] text-[#9a9a9a] cursor-help"
          title={reasons.join(' • ')}
        >
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
            {reasons[0]}
          </span>
          {reasons.length > 1 && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
              +{reasons.length - 1} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
