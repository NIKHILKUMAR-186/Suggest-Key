import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Users,
} from 'lucide-react';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import {
  SegmentEducationService,
  SegmentEducationData,
} from '../../domains/segment/segmentEducation';
import { DynamicIcon } from '../common/DynamicIcon';

interface SegmentIntroductionProps {
  segment?: AdvisorySegment | string;
  className?: string;
  showTransitionBanner?: boolean;
}

export const SegmentIntroduction: React.FC<SegmentIntroductionProps> = ({
  segment = 'all',
  className = '',
  showTransitionBanner = true,
}) => {
  const [data, setData] = useState<SegmentEducationData>(() => {
    if (typeof segment === 'object' && segment !== null) {
      return SegmentEducationService.fromSegment(segment);
    }
    return SegmentEducationService.getAllDomainsData();
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (typeof segment === 'object' && segment !== null) {
      setData(SegmentEducationService.fromSegment(segment));
      return;
    }

    const slug = typeof segment === 'string' ? segment : 'all';
    setLoading(true);

    SegmentEducationService.getEducationData(slug).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [segment]);

  const accentColor = data.accentColor || '#8052ff';

  return (
    <section
      aria-label={`${data.title} Overview`}
      className={`space-y-4 ${className}`}
    >
      {/* Dynamic Sleek Educational Card */}
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.035] to-transparent p-5 sm:p-6 md:p-7 transition-all duration-300"
        style={{
          boxShadow: `0 0 40px -15px ${accentColor}18`,
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none blur-3xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />

        <div className="relative space-y-5">
          {/* Header Row: Icon + Title + Badge + Audience */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
                style={{ color: accentColor }}
              >
                <DynamicIcon name={data.iconName} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-normal text-white tracking-tight">
                    {data.title}
                  </h1>
                  <span
                    className="text-[10px] uppercase font-medium tracking-wider px-2.5 py-0.5 rounded-full border"
                    style={{
                      borderColor: `${accentColor}40`,
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                    }}
                  >
                    {data.badge}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#8e8e93] flex items-center gap-1.5 self-start sm:self-center">
              <Users className="w-3.5 h-3.5 text-[#707070]" />
              <span>{data.audience}</span>
            </div>
          </div>

          {/* Crisp Tagline / Summary */}
          <p className="text-sm sm:text-base text-[#d1d1d6] font-light leading-snug max-w-3xl">
            {data.tagline}
          </p>

          {/* Dynamic Focus Topic Chips from Database use_cases */}
          {data.focusTopics && data.focusTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[#707070] font-semibold mr-1">
                Focus Areas:
              </span>
              {data.focusTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-xs text-[#a1a1aa] px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 hover:text-white transition-colors"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* 2-Column Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
            {/* When to Seek Guidance */}
            <div className="md:col-span-7 p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#9a9a9a] block">
                When to Seek 1:1 Guidance
              </span>
              <ul className="space-y-2">
                {data.isThisForYou.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#d1d1d6] leading-relaxed"
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: accentColor }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Who You'll Find */}
            <div className="md:col-span-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-2.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Who You’ll Find</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#15846e] px-1.5 py-0.5 rounded bg-[#15846e]/10 border border-[#15846e]/20 font-semibold">
                    {data.whoYouWillFind.badge}
                  </span>
                </div>
                <p className="text-xs text-[#9a9a9a] leading-relaxed">
                  {data.whoYouWillFind.description}
                </p>
              </div>

              <div className="text-[10px] text-[#707070] pt-2 border-t border-white/5 flex items-center justify-between">
                <span>Empirically audited credentials & escrow session protection.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logical Transition Banner before Advisors */}
      {showTransitionBanner && (
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: accentColor }}
            >
              Explore Advisors
            </span>
            <span className="text-xs text-[#707070]">•</span>
            <span className="text-xs text-[#9a9a9a]">
              {data.slug === 'all'
                ? 'Verified specialists across all active domains'
                : `Verified specialists in ${data.title}`}
            </span>
          </div>
          <div className="text-[11px] text-[#707070] hidden sm:flex items-center gap-1">
            <span>Scroll horizontally or filter below</span>
            <ArrowRight className="w-3 h-3" style={{ color: accentColor }} />
          </div>
        </div>
      )}
    </section>
  );
};
