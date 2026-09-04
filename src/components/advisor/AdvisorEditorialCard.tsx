import React from 'react';
import { Link } from 'react-router-dom';
import {
  AdvisorDetail,
  getCredentialsSummary,
} from '../../domains/advisor/AdvisorService';
import { ShieldCheck, Star, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SegmentService } from '../../domains/segment/SegmentService';
import { DynamicIcon } from '../common/DynamicIcon';

interface AdvisorEditorialCardProps {
  advisor: AdvisorDetail;
  categorySlug?: string;
}

export const AdvisorEditorialCard: React.FC<AdvisorEditorialCardProps> = ({
  advisor,
  categorySlug,
}) => {
  const primaryGig = (advisor.gigs || [])[0];
  const seg = SegmentService.getCachedSegmentBySlug(
    advisor.segment_id || advisor.verified_categories?.[0] || categorySlug
  );
  const segmentSlug = seg?.slug || categorySlug || advisor.segment_id || '';
  const segmentName = seg?.name || advisor.segment_name || categorySlug || 'Advisor';
  const segmentAccent = seg?.accent || '#8052ff';
  const roleTitle = advisor.role_title || `${segmentName} Advisor`;

  const creds = getCredentialsSummary(advisor);

  const activeSegments = (advisor.mentor_segments || [])
    .filter((ms) => ms.status === 'active')
    .map((ms) => {
      const segData =
        ms.segment ||
        (ms.segment_id
          ? SegmentService.getCachedSegmentBySlug(ms.segment_id)
          : null);
      return {
        slug: segData?.slug || ms.segment_id,
        name: segData?.name || ms.segment_id,
        accent: segData?.accent || segmentAccent,
        icon: segData?.icon || 'Sparkles',
      };
    });

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] hover:border-[#8052ff]/40 p-8 flex flex-col justify-between space-y-6 transition-all duration-300 group relative">
      <div className="space-y-6">
        {/* Segment Pill & Verification Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white">
            <DynamicIcon name={seg?.icon || 'Sparkles'} className="w-3.5 h-3.5" style={{ color: segmentAccent }} />
            <span>{segmentName}</span>
          </div>
          <Badge color={segmentAccent}>
            {roleTitle}
          </Badge>
        </div>

        {/* Header Profile Row */}
        <div className="flex items-start gap-5">
          <Link to={`/mentor/${advisor.id}`} className="shrink-0 relative">
            <img
              src={advisor.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={advisor.profile?.full_name || 'Advisor'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] object-cover border border-white/10 group-hover:border-[#8052ff]/50 transition-colors"
            />
            {advisor.verification_status === 'approved' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0e0e0e] border border-[#15846e] flex items-center justify-center text-[#15846e] shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </Link>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/mentor/${advisor.id}`}
                className="text-lg sm:text-xl font-medium text-white group-hover:text-[#8052ff] transition-colors truncate"
              >
                {advisor.profile?.full_name || 'Advisor'}
              </Link>
              {creds.isVerified && (
                <span className="text-[11px] text-[#15846e] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#15846e]/10 border border-[#15846e]/20">
                  Audited
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#8052ff] font-medium leading-snug line-clamp-1">
              {advisor.headline}
            </p>

            {creds.isVerified && creds.displayLine && (
              <p className="text-[11px] text-[#9a9a9a] leading-tight line-clamp-1">
                {creds.displayLine} • {advisor.experience_years || 5}+ yrs practice
              </p>
            )}
          </div>
        </div>

        {/* Multi-Segment Pills (when mentor has segments beyond primary) */}
        {activeSegments.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {activeSegments.slice(0, 3).map((ms, i) => (
              <span
                key={ms.slug || i}
                className="text-[10px] text-[#9a9a9a] px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
              >
                {ms.name}
              </span>
            ))}
          </div>
        )}

        {/* Bio summary excerpt */}
        <p className="text-xs sm:text-sm text-[#bdbdbd] font-light leading-relaxed line-clamp-3">
          {advisor.bio}
        </p>

        {/* Rating & Practice Stats Strip */}
        <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-[#ffb829]">
            <Star className="w-3.5 h-3.5 fill-[#ffb829]" />
            <span className="font-semibold">{(advisor.rating || 5).toFixed(2)}</span>
            <span className="text-[#9a9a9a]">({advisor.review_count || 0} verified reviews)</span>
          </div>
          <span className="text-xs text-[#9a9a9a]">
            {(advisor.gigs || []).length} {(advisor.gigs || []).length === 1 ? 'Offering' : 'Offerings'}
          </span>
        </div>

        {/* Primary Headline Offering Card */}
        {primaryGig && (
          <div className="p-4 rounded-2xl border border-white/5 bg-black/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#9a9a9a] font-semibold block">
                Primary 1:1 Offering
              </span>
              <span className="text-xs font-semibold text-white">
                ₹{(primaryGig.price_inr || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <Link
              to={`/mentor/${advisor.id}`}
              className="text-sm font-medium text-white hover:text-[#8052ff] transition-colors block line-clamp-1"
            >
              {primaryGig.title}
            </Link>
            <div className="flex items-center gap-3 text-[11px] text-[#9a9a9a] pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8052ff]" />
                {primaryGig.duration_minutes} mins
              </span>
              <span>•</span>
              <span className="text-[#15846e] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Atomic slot booking
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-3">
        <Link
          to={`/mentor/${advisor.id}`}
          className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wider text-center transition-all"
        >
          View Profile
        </Link>
        <Link
          to={`/gigs/${primaryGig?.id || advisor.id}`}
          className="flex-1 py-3 px-4 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#8052ff]/20"
        >
          <span>Book Session</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
