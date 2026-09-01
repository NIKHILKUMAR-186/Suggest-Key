import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Sparkles,
  Loader2,
  Calendar,
  Heart,
  Briefcase,
  Brain,
  Coins,
  GraduationCap,
  Scale,
  Compass,
  Building2,
  TrendingUp,
  Globe,
  Users,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import { SegmentService } from '../../domains/segment/SegmentService';
import { Gig } from '../../lib/supabase/types';

interface PaginatedAdvisorCarouselProps {
  segment?: string;
  searchQuery?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  viewAllLink?: string;
  onBookSession?: (advisor: AdvisorDetail, gig: Gig) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Heart,
  Briefcase,
  Brain,
  Sparkles,
  Coins,
  GraduationCap,
  Scale,
  Compass,
  Building2,
  TrendingUp,
  Globe,
  Users,
};

export const PaginatedAdvisorCarousel: React.FC<PaginatedAdvisorCarouselProps> = ({
  segment = 'all',
  searchQuery = '',
  title,
  subtitle,
  badge,
  viewAllLink,
  onBookSession,
  className = '',
}) => {
  // Database paginated list state
  const [advisors, setAdvisors] = useState<AdvisorDetail[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);

  // Dynamic Segment Info
  const [segmentData, setSegmentData] = useState<AdvisorySegment | null>(null);

  // Carousel view index (which card pair is currently visible: 0 = cards 0 & 1, 2 = cards 2 & 3, etc.)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSegmentMeta() {
      if (segment && segment !== 'all') {
        const seg = await SegmentService.getSegmentBySlug(segment);
        if (isMounted && seg) {
          setSegmentData(seg);
        }
      } else {
        setSegmentData(null);
      }
    }
    loadSegmentMeta();
    return () => {
      isMounted = false;
    };
  }, [segment]);

  const accent = segmentData?.accent || '#8052ff';
  const SegmentIcon = ICON_MAP[segmentData?.icon || 'Sparkles'] || Sparkles;

  // 1. Initial Page Load (Max 6 records batch)
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let isMounted = true;
    isFetchingRef.current = true;
    setLoadingInitial(true);
    setCurrentIndex(0);

    const fetchInitialBatch = async () => {
      try {
        const response = await AdvisorService.getPaginatedAdvisors({
          segment: segment !== 'all' ? segment : undefined,
          searchQuery,
          page: 1,
          limit: 6, // Strictly batch size 6
        });

        if (isMounted) {
          setAdvisors(response.advisors as AdvisorDetail[]);
          setHasMore(response.hasMore);
          setTotalCount(response.totalCount);
          setPage(1);
          setLoadingInitial(false);
          isFetchingRef.current = false;
        }
      } catch (err) {
        if (isMounted) {
          setLoadingInitial(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchInitialBatch();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [segment, searchQuery]);

  // 2. Fetch Next Database Batch (Max 6 records)
  const fetchNextBatch = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loadingNext) return;

    isFetchingRef.current = true;
    setLoadingNext(true);

    try {
      const nextPage = page + 1;
      const response = await AdvisorService.getPaginatedAdvisors({
        segment: segment !== 'all' ? segment : undefined,
        searchQuery,
        page: nextPage,
        limit: 6, // Strictly batch size 6
      });

      setAdvisors((prev) => {
        // Prevent duplicate IDs
        const existingIds = new Set(prev.map((a) => a.id));
        const newItems = (response.advisors as AdvisorDetail[]).filter((a) => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });

      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load next advisor batch:', err);
    } finally {
      setLoadingNext(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, loadingNext, page, segment, searchQuery]);

  // Scroll to index helper
  const scrollToIndex = (index: number) => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const cardWidth = container.offsetWidth >= 768 ? (container.offsetWidth - 20) / 2 : container.offsetWidth;
    const targetScroll = index * (cardWidth + 16);

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    setCurrentIndex(index);
  };

  // 3. Navigation Arrow Handlers
  const handlePrev = () => {
    if (currentIndex <= 0) return;
    const newIdx = Math.max(0, currentIndex - 2);
    scrollToIndex(newIdx);
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 2;
    // Check if we are approaching the end of currently loaded advisors (within 2 cards) -> trigger prefetch
    if (nextIdx >= advisors.length - 2 && hasMore && !loadingNext) {
      fetchNextBatch();
    }
    if (nextIdx < advisors.length) {
      scrollToIndex(nextIdx);
    }
  };

  // Listen to manual user horizontal scroll gestures to keep index in sync
  const handleScroll = () => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const cardWidth = container.offsetWidth >= 768 ? (container.offsetWidth - 20) / 2 : container.offsetWidth;
    const newIndex = Math.round(container.scrollLeft / (cardWidth + 16));

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }

    // Prefetch trigger when scrolled close to the loaded end
    if (newIndex >= advisors.length - 3 && hasMore && !loadingNext && !isFetchingRef.current) {
      fetchNextBatch();
    }
  };

  const displayTitle = title || (segmentData ? `${segmentData.name} Specialists` : 'Verified Advisors');
  const displaySubtitle = subtitle || (segmentData ? segmentData.short_description : 'Audited domain specialists available for 1:1 sessions.');
  const displayBadge = badge || (segmentData ? segmentData.badge : 'Audited Specialists');

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < advisors.length - 2 || hasMore;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Row: Title, Subtitle, Dynamic Badge & Horizontal Carousel Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: `${accent}15`,
                borderColor: `${accent}30`,
              }}
            >
              <SegmentIcon className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
            <h2 className="text-lg sm:text-xl font-normal text-white tracking-tight">
              {displayTitle}
            </h2>
            {displayBadge && (
              <span
                className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border hidden sm:inline-flex"
                style={{
                  color: accent,
                  borderColor: `${accent}40`,
                  backgroundColor: `${accent}15`,
                }}
              >
                {displayBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9a9a9a] max-w-2xl">{displaySubtitle}</p>
        </div>

        {/* Carousel Controls & Pagination Status */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs text-[#9a9a9a] hover:text-white hover:underline transition-colors mr-2 hidden md:inline"
            >
              View Domain Specialists →
            </Link>
          )}

          {/* Records Counter Pill */}
          {!loadingInitial && advisors.length > 0 && (
            <span className="text-[11px] text-[#707070] font-mono pr-1">
              Showing {Math.min(currentIndex + 1, advisors.length)}-
              {Math.min(currentIndex + 2, advisors.length)} of {totalCount || advisors.length}
            </span>
          )}

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous advisors"
              className={`p-2 rounded-full border border-white/10 transition-all ${
                canGoPrev
                  ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer active:scale-95'
                  : 'bg-transparent text-white/20 border-white/5 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={!canGoNext && !loadingNext}
              aria-label="Next advisors"
              className={`p-2 rounded-full border border-white/10 transition-all ${
                canGoNext || loadingNext
                  ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer active:scale-95'
                  : 'bg-transparent text-white/20 border-white/5 cursor-not-allowed'
              }`}
            >
              {loadingNext ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Horizontal Track - Strictly 2 Cards on Desktop (md:w-[calc(50%-10px)]), 1 Card on Mobile (w-full) */}
      {loadingInitial ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-[24px] border border-white/5 bg-white/[0.02] animate-pulse space-y-4 min-h-[280px]"
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
      ) : advisors.length === 0 ? (
        <div className="p-10 rounded-[24px] border border-dashed border-white/10 text-center space-y-3 bg-white/[0.01]">
          <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#707070]" />
          </div>
          <div className="text-sm font-medium text-white">No advisors currently available in this domain.</div>
          <p className="text-xs text-[#9a9a9a] max-w-sm mx-auto">
            {searchQuery
              ? `No specialists matched "${searchQuery}". Try broadening your search.`
              : 'Our operator audit team is currently verifying practitioners for this domain.'}
          </p>
        </div>
      ) : (
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {advisors.map((advisor) => {
            const primaryGig = advisor.gigs && advisor.gigs.length > 0 ? advisor.gigs[0] : null;
            const price = primaryGig ? primaryGig.price_inr : 4500;
            const duration = primaryGig ? primaryGig.duration_minutes : 45;

            return (
              <div
                key={advisor.id}
                className="w-full md:w-[calc(50%-10px)] shrink-0 snap-start rounded-[24px] border border-white/10 bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group hover:border-white/20"
                style={{
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="space-y-4">
                  {/* Top Profile Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/advisors/${advisor.id}`}
                      className="flex items-center gap-3.5 group/profile"
                    >
                      <div className="relative">
                        <img
                          src={
                            advisor.profile?.avatar_url ||
                            `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
                          }
                          alt={advisor.profile?.full_name || 'Advisor'}
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border border-white/10 group-hover/profile:border-white/30 transition-all"
                        />
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center"
                          title="Audited specialist"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#15846e]" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-medium text-white group-hover/profile:text-[#8052ff] transition-colors">
                            {advisor.profile?.full_name}
                          </h3>
                        </div>
                        <p className="text-xs text-[#9a9a9a] line-clamp-1">
                          {advisor.headline || advisor.role_title || 'Verified Specialist'}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#707070] pt-0.5">
                          <div className="flex items-center gap-1 text-[#ffb829]">
                            <Star className="w-3 h-3 fill-[#ffb829]" />
                            <span className="font-semibold text-white">
                              {(advisor.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{advisor.review_count || 12} reviews</span>
                          <span>•</span>
                          <span>{advisor.experience_years || 8}+ yrs exp</span>
                        </div>
                      </div>
                    </Link>

                    {/* Price Tag */}
                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-semibold text-white">
                        ₹{price.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#707070] flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{duration} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio statement */}
                  <p className="text-xs text-[#bdbdbd] line-clamp-2 leading-relaxed font-light">
                    {advisor.bio}
                  </p>

                  {/* Focus Badges */}
                  {advisor.specialties && advisor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {advisor.specialties.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-[#9a9a9a] px-2.5 py-0.5 rounded-full border border-white/5 bg-white/[0.02]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-[#15846e]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Escrow Guaranteed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/advisors/${advisor.id}`}
                      className="px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 text-xs text-[#9a9a9a] hover:text-white transition-colors"
                    >
                      Dossier
                    </Link>

                    {primaryGig ? (
                      <button
                        onClick={() => onBookSession && onBookSession(advisor, primaryGig)}
                        className="px-4 py-1.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                        style={{
                          backgroundColor: accent,
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Consult</span>
                      </button>
                    ) : (
                      <Link
                        to={`/advisors/${advisor.id}`}
                        className="px-4 py-1.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                        style={{
                          backgroundColor: accent,
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
