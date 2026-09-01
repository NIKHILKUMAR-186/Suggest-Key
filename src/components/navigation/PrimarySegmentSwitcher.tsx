import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Sparkles, ChevronRight, Layers } from 'lucide-react';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import { SegmentService } from '../../domains/segment/SegmentService';
import { DynamicIcon } from '../common/DynamicIcon';

interface PrimarySegmentSwitcherProps {
  className?: string;
  showAllOption?: boolean;
}

export const PrimarySegmentSwitcher: React.FC<PrimarySegmentSwitcherProps> = ({
  className = '',
  showAllOption = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeSegmentParam = searchParams.get('segment');

  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSegments() {
      try {
        const data = await SegmentService.getActiveSegments();
        if (isMounted) {
          setSegments(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load segments in switcher', err);
        if (isMounted) setLoading(false);
      }
    }
    loadSegments();

    // Listen for storage events (e.g. admin created/updated a segment in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'suggestkey_advisory_segments_db') {
        loadSegments();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isDiscoverPage = location.pathname === '/seeker/discover';

  const handleSelectSegment = (segmentSlug: string | 'all') => {
    if (segmentSlug === 'all') {
      navigate('/seeker/discover');
    } else {
      navigate(`/seeker/discover?segment=${encodeURIComponent(segmentSlug)}`);
    }
  };

  if (loading && segments.length === 0) {
    return (
      <div className={`w-full bg-[#08080a] border-b border-white/10 py-3 ${className}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 flex-1 min-w-[200px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className={`w-full bg-[#08080a] border-b border-white/10 py-3 ${className}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-xs text-[#9a9a9a]">
          No advisory domains are currently available.
        </div>
      </div>
    );
  }

  return (
    <div
      id="primary-segment-switcher"
      className={`w-full bg-[#08080a] border-b border-white/10 ${className}`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
        {/* Subtle Guidance Prompt Header */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#8e8e93] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#8052ff]" />
              Select Advisory Domain
            </span>
            <span className="hidden md:inline text-[11px] text-[#555] font-normal">
              — Choose the primary guidance pillar for your 1:1 advisory sessions
            </span>
          </div>

          {isDiscoverPage && activeSegmentParam && (
            <button
              onClick={() => handleSelectSegment('all')}
              className="text-[11px] uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors underline-offset-4 hover:underline flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              <span>View All Domains</span>
            </button>
          )}
        </div>

        {/* Dynamic Database-Driven Segment Switcher Bar - Horizontal & Responsive */}
        <div
          role="tablist"
          aria-label="Advisory Product Segments"
          className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-none snap-x"
        >
          {segments.map((segment) => {
            const isActive =
              activeSegmentParam === segment.slug ||
              activeSegmentParam === segment.id ||
              (!activeSegmentParam && segments.length > 0 && segments[0].slug === segment.slug && !isDiscoverPage);

            const accent = segment.accent || '#8052ff';

            return (
              <button
                key={segment.id}
                role="tab"
                aria-selected={isActive}
                id={`segment-tab-${segment.slug}`}
                onClick={() => handleSelectSegment(segment.slug)}
                className={`group relative flex-1 min-w-[200px] sm:min-w-[220px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 snap-start flex flex-col justify-between ${
                  isActive
                    ? 'bg-white/[0.06] border-white/30 shadow-lg ring-1 ring-white/10'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] text-[#8e8e93] hover:text-white'
                }`}
                style={{
                  borderColor: isActive ? `${accent}80` : undefined,
                  boxShadow: isActive ? `0 10px 25px -10px ${accent}25` : undefined,
                }}
              >
                {/* Active Glow Accent Background */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-40"
                    style={{
                      background: `radial-gradient(circle at top left, ${accent}25 0%, transparent 70%)`,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isActive ? `${accent}20` : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? accent : undefined,
                      }}
                    >
                      <DynamicIcon name={segment.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-semibold tracking-tight ${
                            isActive ? 'text-white' : 'text-[#bdbdbd] group-hover:text-white'
                          }`}
                        >
                          {segment.name}
                        </span>
                        {isActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: accent }}
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-[#707070] group-hover:text-[#9a9a9a] block truncate max-w-[150px]">
                        {segment.audience || segment.advisor_types || 'Audited Specialists'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 mt-1 transition-transform ${
                      isActive
                        ? 'text-white translate-x-0.5'
                        : 'text-[#444] group-hover:text-[#888] group-hover:translate-x-0.5'
                    }`}
                  />
                </div>

                {/* Subtitle / Focus description on larger viewports */}
                <p className="relative z-10 text-[11px] text-[#6e6e73] group-hover:text-[#8e8e93] mt-2 line-clamp-1 hidden lg:block">
                  {segment.short_description || segment.description}
                </p>

                {/* Active Tab Underline Indicator */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
