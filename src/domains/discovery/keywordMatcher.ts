/**
 * Suggest Key — Problem-to-Domain/Advisor Matching (MVP)
 *
 * This module is a PURE, side-effect-free matching layer. It contains NO database
 * access and NO UI logic, so it can be unit-tested in isolation and later swapped
 * out for an LLM-based strategy without touching components or services.
 *
 * Contract:
 *   normalize() / tokenize()  -> text utilities
 *   scoreDomains()            -> rank advisory segments by keyword coverage
 *   scoreAdvisor()            -> relevance of a single advisor to a problem
 *   matchProblem()            -> top-level orchestrator (domain + advisors + intent)
 */

export interface MatcherAdvisor {
  id: string;
  headline: string;
  bio: string;
  specialties: string[];
  verified_categories: string[];
  rating: number;
  review_count: number;
  experience_years: number;
  gigs: { title: string; description: string }[];
  segment_slugs: string[];
}

export interface MatcherSegment {
  id: string;
  slug: string;
  name: string;
  use_cases: string[];
  description: string;
  short_description: string;
}

export interface MatchedAdvisor extends MatcherAdvisor {
  matchScore: number;
  matchedFocusAreas: string[];
}

export interface SuggestedDomain {
  slug: string;
  name: string;
  confidence: number;
}

export interface ProblemMatchResult {
  problem: string;
  intent: string;
  confidence: number;
  isUncertain: boolean;
  suggestedDomains: SuggestedDomain[];
  primaryDomain: SuggestedDomain | null;
  focusAreas: string[];
  advisors: MatchedAdvisor[];
}

// ---------------------------------------------------------------------------
// Domain keyword dictionaries (common problem language per advisory domain).
// Kept as plain data so the engine is data-driven and easy to extend.
// ---------------------------------------------------------------------------
export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  relationship: [
    'relationship',
    'partner',
    'partnership',
    'spouse',
    'wife',
    'husband',
    'dating',
    'marriage',
    'married',
    'divorce',
    'breakup',
    'break up',
    'affair',
    'intimacy',
    'intimate',
    'attachment',
    'communicate',
    'communication',
    'conflict',
    'family',
    'boundary',
    'boundaries',
    'couples',
    'couple',
    'co-parent',
    'parenting',
    'trust',
    'resentment',
    'in-laws',
    'extended family',
    'gottman',
    'mediation',
  ],
  career: [
    'career',
    'job',
    'jobs',
    'promotion',
    'promote',
    'staff',
    'engineer',
    'engineering',
    'manager',
    'management',
    'leadership',
    'leader',
    'lead',
    'ceo',
    'vp',
    'director',
    'interview',
    'negotiate',
    'negotiation',
    'compensation',
    'salary',
    'equity',
    'rsu',
    'stock',
    'founder',
    'startup',
    'board',
    'pivot',
    'transition',
    'resume',
    'offer',
    'package',
    'layoff',
    'redundancy',
  ],
  'mental-health': [
    'stress',
    'burnout',
    'burn out',
    'anxious',
    'anxiety',
    'depression',
    'depress',
    'panic',
    'sleep',
    'insomnia',
    'focus',
    'concentrate',
    'overwhelm',
    'overwhelmed',
    'fatigue',
    'tired',
    'mental health',
    'therapist',
    'therapy',
    'cope',
    'coping',
    'emotion',
    'emotional',
    'regulate',
    'resilience',
    'neuro',
    'cognitive',
    'imposter',
    'perfectionism',
    'perfectionist',
  ],
};

export const DOMAIN_DISPLAY: Record<string, string> = {
  relationship: 'Relationship',
  career: 'Career',
  'mental-health': 'Mental Health',
};

const STOPWORDS = new Set(
  'a an the and or but of to in on for with at from is are was were be been being this that these those i you your our we they'.split(
    ' '
  )
);

const MAX_CONFIDENCE_SCORE = 6;
const UNCERTAINTY_RATIO = 0.7;
const RATING_WEIGHT = 0.3;
const RELEVANCE_WEIGHT = 0.7;
const SPECIALTY_WEIGHT = 3;
const GIG_WEIGHT = 2;

export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[/+/]/g, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tokenizeNoStop(text: string): string[] {
  return tokenize(text).filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

function containsKeyword(haystack: string, keyword: string): boolean {
  const kw = normalizeText(keyword);
  if (!kw) return false;
  if (haystack.includes(kw)) return true;
  const kwTokens = kw.split(' ').filter(Boolean);
  if (kwTokens.length > 1) {
    return kwTokens.every((t) => haystack.includes(t));
  }
  return false;
}

export function scoreDomains(problem: string, segments: MatcherSegment[]): SuggestedDomain[] {
  const haystack = normalizeText(problem);
  const results: SuggestedDomain[] = [];

  for (const seg of segments) {
    const keywords = DOMAIN_KEYWORDS[seg.slug] || [];
    if (keywords.length === 0) {
      results.push({ slug: seg.slug, name: seg.name, confidence: 0 });
      continue;
    }

    const matchedKeywords = keywords.filter((kw) => containsKeyword(haystack, kw));

    const domainText = normalizeText(
      [...(seg.use_cases || []), seg.description, seg.short_description].join(' ')
    );
    const problemTokens = tokenizeNoStop(problem);
    const useCaseMatches = problemTokens.filter(
      (t) => t.length > 2 && domainText.includes(t)
    );
    const bonus = useCaseMatches.length * 0.5;

    const rawScore = matchedKeywords.length + bonus;
    const confidence = Math.min(rawScore / MAX_CONFIDENCE_SCORE, 1);
    results.push({ slug: seg.slug, name: seg.name, confidence });
  }

  return results
    .filter((d) => d.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
}

export function scoreAdvisor(problem: string, advisor: MatcherAdvisor): {
  score: number;
  focusAreas: string[];
} {
  const haystack = normalizeText(problem);
  const focusAreas: string[] = [];

  let specialtyHits = 0;
  for (const spec of advisor.specialties || []) {
    if (containsKeyword(haystack, spec)) {
      specialtyHits++;
      focusAreas.push(spec);
    }
  }

  let gigHits = 0;
  for (const gig of advisor.gigs || []) {
    if (containsKeyword(haystack, gig.title)) {
      gigHits++;
      focusAreas.push(gig.title.split('|')[0].trim());
    }
    if (containsKeyword(haystack, gig.description || '')) {
      gigHits++;
    }
  }

  const problemTokens = tokenizeNoStop(problem);
  const advisorTokens = new Set(
    tokenizeNoStop(
      [
        advisor.headline,
        advisor.bio,
        ...(advisor.specialties || []),
        ...(advisor.gigs || []).map((g) => `${g.title} ${g.description || ''}`),
      ].join(' ')
    )
  );
  const matchedSharedTokens = problemTokens.filter((t) => advisorTokens.has(t) && t.length > 2);
  const tokenOverlap = matchedSharedTokens.length;

  const relevanceRaw =
    specialtyHits * SPECIALTY_WEIGHT + gigHits * GIG_WEIGHT + tokenOverlap;
  const relevanceNorm = Math.min(relevanceRaw / (SPECIALTY_WEIGHT * 4 + GIG_WEIGHT * 4 + 6), 1);

  const ratingNorm = advisor.rating / 5;
  const score = RELEVANCE_WEIGHT * relevanceNorm + RATING_WEIGHT * ratingNorm;

  const combined = [...new Set([...focusAreas, ...matchedSharedTokens])].slice(0, 5);

  return { score: Number(score.toFixed(4)), focusAreas: combined };
}

export function summarizeIntent(problem: string, bestDomain: SuggestedDomain | null): string {
  const domainKw = bestDomain ? (DOMAIN_KEYWORDS[bestDomain.slug] || []) : [];
  const haystack = normalizeText(problem);
  const matched = domainKw.filter((kw) => containsKeyword(haystack, kw)).slice(0, 4);
  const domainPart = bestDomain ? ` in ${bestDomain.name.toLowerCase()}` : '';
  if (matched.length > 0) {
    return `Problem around: ${matched.join(', ')}.${domainPart}`;
  }
  const tokens = tokenizeNoStop(problem).slice(0, 4);
  return tokens.length
    ? `Problem around: ${tokens.join(', ')}.${domainPart}`
    : 'Need guidance on a personal or professional challenge.';
}

export function matchProblem(
  problem: string,
  segments: MatcherSegment[],
  advisors: MatcherAdvisor[]
): ProblemMatchResult {
  const trimmed = (problem || '').trim();

  const suggestedDomains = scoreDomains(trimmed, segments);
  const sorted = [...suggestedDomains].sort((a, b) => b.confidence - a.confidence);

  const hasAnyMatch = sorted.length > 0;
  const top = sorted[0];
  const second = sorted[1];

  let isUncertain: boolean;
  let primaryDomain: SuggestedDomain | null = null;

  if (!trimmed || !hasAnyMatch) {
    isUncertain = true;
  } else if (second && second.confidence >= top.confidence * UNCERTAINTY_RATIO) {
    isUncertain = true;
  } else {
    isUncertain = false;
    primaryDomain = top;
  }

  const primarySlug = primaryDomain ? primaryDomain.slug : null;
  const candidateAdvisors = primarySlug
    ? advisors.filter((a) => (a.segment_slugs || []).includes(primarySlug))
    : advisors;

  const scored = candidateAdvisors
    .map((a) => {
      const { score, focusAreas } = scoreAdvisor(trimmed, a);
      return { ...a, matchScore: Number(score.toFixed(4)), matchedFocusAreas: focusAreas };
    })
    .sort((a, b) => b.matchScore - a.matchScore || (b.rating as number) - (a.rating as number));

  const focusAreaSet = new Set<string>();
  for (const a of scored.slice(0, 6)) {
    for (const fa of a.matchedFocusAreas) {
      focusAreaSet.add(fa);
    }
  }

  let intent = summarizeIntent(trimmed, primaryDomain || null);
  let confidence = 0;
  if (primaryDomain) {
    confidence = primaryDomain.confidence;
  } else if (hasAnyMatch) {
    confidence = Math.min(sorted.reduce((s, d) => s + d.confidence, 0), 1);
  }

  const suggested = isUncertain
    ? sorted
    : primaryDomain
    ? [primaryDomain]
    : [];

  return {
    problem: trimmed,
    intent,
    confidence: Number(confidence.toFixed(2)),
    isUncertain,
    suggestedDomains: suggested,
    primaryDomain,
    focusAreas: Array.from(focusAreaSet),
    advisors: scored,
  };
}
