import { AdvisorDetail } from '../domains/advisor/AdvisorService';
import { AdvisorySegment } from '../domains/segment/SegmentTypes';
import { MentorSegment } from '../lib/supabase/types';

export interface RecommendationEntry {
  advisor: AdvisorDetail;
  score: number;
  confidence: number;
  reasons: string[];
  matchedUseCases: string[];
  segmentMatch: boolean;
}

export interface RecommendOptions {
  preferredSegmentSlug?: string;
  limit?: number;
  minRating?: number;
  minReviewCount?: number;
}

const WEIGHTS = {
  trust: 0.4,
  experience: 0.25,
  credentials: 0.2,
  segmentAlignment: 0.15,
} as const;

const MAX_EXPERIENCE_YEARS = 30;
const CRED_FRESHNESS_DECAY_MS = 1000 * 60 * 60 * 24 * 365;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeTrustScore(
  rating: number,
  reviewCount: number
): { score: number; reason: string } {
  const normalizedRating = rating / 5;
  const reviewLog = Math.log10(reviewCount + 1);
  const raw = normalizedRating * (1 + reviewLog);
  const score = clamp(raw / 2, 0, 1);

  const badge =
    reviewCount >= 30
      ? 'high-volume verified reviews'
      : reviewCount >= 10
      ? 'strong review base'
      : 'growing review base';

  return {
    score,
    reason: `${rating.toFixed(2)}★ across ${reviewCount} verified reviews (${badge})`,
  };
}

function computeExperienceScore(
  years: number
): { score: number; reason: string } {
  const normalized = clamp(years / MAX_EXPERIENCE_YEARS, 0, 1);
  return {
    score: normalized,
    reason: `${years}+ years verified advisory practice`,
  };
}

function computeCredentialScore(
  verifiedAt: string | null | undefined
): { score: number; reason: string } {
  if (!verifiedAt) {
    return { score: 0.3, reason: 'Credentials on file' };
  }

  const verifiedMs = new Date(verifiedAt).getTime();
  const nowMs = Date.now();
  const ageMs = nowMs - verifiedMs;

  let recencyScore = 1;
  if (ageMs > CRED_FRESHNESS_DECAY_MS * 2) {
    recencyScore = 0.7;
  } else if (ageMs > CRED_FRESHNESS_DECAY_MS) {
    recencyScore = 0.85;
  }

  const dateStr = new Date(verifiedAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return {
    score: recencyScore,
    reason: `credentials independently verified ${dateStr}`,
  };
}

function computeSegmentAlignment(
  advisor: AdvisorDetail,
  segments: AdvisorySegment[]
): { score: number; matchedUseCases: string[]; reason: string } {
  const advisorSegments = advisor.mentor_segments || [];
  const verifiedCategories = advisor.verified_categories || [];

  let hasSegmentMatch = false;
  let matchedUseCases: string[] = [];
  let matchedSegmentName = '';

  for (const ms of advisorSegments) {
    const seg = segments.find(
      (s) => s.id === ms.segment_id || s.slug === ms.segment_id
    );
    const resolvedSeg =
      seg ||
      (ms.segment
        ? {
            id: ms.segment.id,
            name: ms.segment.name,
            slug: ms.segment.slug,
            use_cases: [],
          }
        : null);

    if (resolvedSeg) {
      hasSegmentMatch = true;
      matchedSegmentName = resolvedSeg.name;
      if (resolvedSeg.use_cases && resolvedSeg.use_cases.length > 0) {
        matchedUseCases = resolvedSeg.use_cases;
      }
      break;
    }
  }

  if (!hasSegmentMatch && verifiedCategories.length > 0) {
    const catSlug = verifiedCategories[0];
    const seg = segments.find(
      (s) => s.slug === catSlug || s.id === catSlug
    );
    if (seg) {
      hasSegmentMatch = true;
      matchedSegmentName = seg.name;
      matchedUseCases = seg.use_cases || [];
    } else {
      hasSegmentMatch = true;
      matchedSegmentName = catSlug;
    }
  }

  const score = hasSegmentMatch ? 1 : 0;
  const reason = hasSegmentMatch
    ? `Specialist in ${matchedSegmentName}`
    : 'Cross-domain advisor';

  return { score, matchedUseCases, reason };
}

export interface RecommendationEngine {
  recommend(
    advisors: AdvisorDetail[],
    segments: AdvisorySegment[],
    options?: RecommendOptions
  ): RecommendationEntry[];
}

export const RecommendationEngine: RecommendationEngine = {
  recommend(advisors, segments, options = {}) {
    const {
      preferredSegmentSlug,
      limit = 12,
      minRating = 0,
      minReviewCount = 0,
    } = options;

    const normalizedPreferredSlug = preferredSegmentSlug
      ? preferredSegmentSlug.toLowerCase().trim()
      : null;

    const entries: RecommendationEntry[] = [];

    for (const advisor of advisors) {
      if (advisor.verification_status !== 'approved') continue;
      if ((advisor.rating || 0) < minRating) continue;
      if ((advisor.review_count || 0) < minReviewCount) continue;

      const trustResult = computeTrustScore(
        advisor.rating || 5,
        advisor.review_count || 0
      );
      const expResult = computeExperienceScore(
        advisor.experience_years || 0
      );
      const credResult = computeCredentialScore(
        advisor.credentials_verified_at
      );
      const segResult = computeSegmentAlignment(advisor, segments);

      let segmentAlignmentScore = segResult.score;
      let segmentMatch = segResult.score >= 1;

      if (normalizedPreferredSlug) {
        const advisorSegSlugs = [
          ...(advisor.verified_categories || []),
        ].map((s) => String(s).toLowerCase().trim());

        const preferredSeg = segments.find(
          (s) =>
            s.slug === normalizedPreferredSlug ||
            s.id === normalizedPreferredSlug
        );

        const advisorSegIds = (advisor.mentor_segments || [])
          .map((ms: MentorSegment) =>
            ms.segment_id ? String(ms.segment_id).toLowerCase() : ''
          )
          .filter(Boolean);

        const matchesPreferred =
          advisorSegSlugs.includes(normalizedPreferredSlug) ||
          (preferredSeg
            ? advisorSegSlugs.includes(preferredSeg.slug) ||
              advisorSegSlugs.includes(preferredSeg.id) ||
              advisorSegIds.includes(preferredSeg.id.toLowerCase())
            : false);

        segmentAlignmentScore = matchesPreferred ? 1 : 0;
        segmentMatch = matchesPreferred;

        if (!matchesPreferred) {
          segmentAlignmentScore = 0;
        }
      }

      const compositeScore = clamp(
        WEIGHTS.trust * trustResult.score +
          WEIGHTS.experience * expResult.score +
          WEIGHTS.credentials * credResult.score +
          WEIGHTS.segmentAlignment * segmentAlignmentScore,
        0,
        1
      );

      const confidence = clamp(
        0.5 +
          (advisor.review_count || 0) / 100 +
          (advisor.experience_years || 0) / 50,
        0.5,
        0.99
      );

      const reasons: string[] = [trustResult.reason, expResult.reason];
      if (credResult.reason) reasons.push(credResult.reason);
      if (segResult.reason) reasons.push(segResult.reason);

      if (normalizedPreferredSlug && segmentMatch) {
        reasons.push(`Recommended for: ${matchedNameOrSlug(segments, normalizedPreferredSlug)}`);
      }

      if (normalizedPreferredSlug && !segmentMatch) {
        continue;
      }

      entries.push({
        advisor,
        score: compositeScore,
        confidence,
        reasons,
        matchedUseCases: segResult.matchedUseCases,
        segmentMatch,
      });
    }

    const sorted = entries.sort((a, b) => b.score - a.score);

    if (limit && limit > 0) {
      return sorted.slice(0, limit);
    }

    return sorted;
  },
};

function matchedNameOrSlug(
  segments: AdvisorySegment[],
  slug: string
): string {
  const seg = segments.find(
    (s) =>
      s.slug.toLowerCase() === slug.toLowerCase() ||
      s.id.toLowerCase() === slug.toLowerCase()
  );
  return seg ? seg.name : slug;
}

export function formatRecommendationScore(entry: RecommendationEntry): string {
  const { advisor, score } = entry;
  const percentage = Math.round(score * 100);

  const trustRank =
    percentage >= 90
      ? 'Exceptional'
      : percentage >= 80
      ? 'High'
      : percentage >= 70
      ? 'Strong'
      : percentage >= 60
      ? 'Solid'
      : 'Good';

  return `${trustRank} Match (${percentage}%)`;
}
