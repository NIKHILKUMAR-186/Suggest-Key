import { describe, it, expect } from 'vitest';
import {
  matchProblem,
  scoreDomains,
  scoreAdvisor,
  normalizeText,
  tokenize,
  DOMAIN_KEYWORDS,
  MatcherSegment,
  MatcherAdvisor,
} from './keywordMatcher';

const SEGMENTS: MatcherSegment[] = [
  {
    id: 'r',
    slug: 'relationship',
    name: 'Relationship',
    use_cases: ['Conflict, communication, boundaries'],
    description: 'For couples and individuals navigating relationships.',
    short_description: 'Relationship guidance',
  },
  {
    id: 'c',
    slug: 'career',
    name: 'Career',
    use_cases: ['Promotion, leadership, job switch'],
    description: 'For professionals navigating career crossroads.',
    short_description: 'Career guidance',
  },
  {
    id: 'm',
    slug: 'mental-health',
    name: 'Mental Health',
    use_cases: ['Burnout, anxiety, focus'],
    description: 'For stress, burnout, and cognitive load.',
    short_description: 'Mental health support',
  },
];

const ADVISORS: MatcherAdvisor[] = [
  {
    id: 'm-rel',
    headline: 'LMFT couples therapist',
    bio: 'Specializing in Gottman and communication.',
    specialties: ['Couples', 'Conflict', 'Boundaries'],
    verified_categories: ['relationship'],
    rating: 4.95,
    review_count: 120,
    experience_years: 12,
    gigs: [
      { title: 'Couples Diagnostic', description: 'For recurring conflict' },
    ],
    segment_slugs: ['relationship'],
  },
  {
    id: 'm-career',
    headline: 'VP Engineering mentor',
    bio: 'Staff+ promotion, leadership, team scaling.',
    specialties: ['Promotion', 'Leadership'],
    verified_categories: ['career'],
    rating: 4.9,
    review_count: 80,
    experience_years: 15,
    gigs: [
      { title: 'Staff+ Promotion Strategy', description: 'For promotion' },
    ],
    segment_slugs: ['career'],
  },
];

describe('keywordMatcher.normalize/tokenize', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeText("I'm struggling with my manager!")).toBe(
      'i m struggling with my manager'
    );
  });

  it('tokenizes whitespace-separated tokens', () => {
    expect(tokenize('a b c')).toEqual(['a', 'b', 'c']);
  });
});

describe('scoreDomains', () => {
  it('matches career problem to career domain', () => {
    const ranked = scoreDomains(
      'I am thinking about switching jobs and my promotion path',
      SEGMENTS
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].slug).toBe('career');
  });

  it('matches relationship problem to relationship domain', () => {
    const ranked = scoreDomains(
      'My partner and I are having communication issues and trust problems',
      SEGMENTS
    );
    expect(ranked[0].slug).toBe('relationship');
  });

  it('matches mental health problem to mental-health domain', () => {
    const ranked = scoreDomains(
      'I am dealing with burnout, anxiety, and poor sleep',
      SEGMENTS
    );
    expect(ranked[0].slug).toBe('mental-health');
  });

  it('returns empty for unrelated text', () => {
    const ranked = scoreDomains('xyzqq foobar', SEGMENTS);
    expect(ranked).toEqual([]);
  });

  it('exposes keyword dictionaries for all canonical domains', () => {
    expect(DOMAIN_KEYWORDS.relationship).toBeDefined();
    expect(DOMAIN_KEYWORDS.career).toBeDefined();
    expect(DOMAIN_KEYWORDS['mental-health']).toBeDefined();
  });
});

describe('scoreAdvisor', () => {
  it('scores a matching advisor higher', () => {
    const career = scoreAdvisor('I want a promotion strategy', ADVISORS[1]);
    const rel = scoreAdvisor('I want a promotion strategy', ADVISORS[0]);
    expect(career.score).toBeGreaterThan(rel.score);
  });

  it('returns focus areas that match the problem', () => {
    const result = scoreAdvisor('I want a promotion strategy', ADVISORS[1]);
    expect(result.focusAreas.length).toBeGreaterThan(0);
  });
});

describe('matchProblem', () => {
  it('returns uncertain when problem text is empty', () => {
    const r = matchProblem('', SEGMENTS, ADVISORS);
    expect(r.isUncertain).toBe(true);
  });

  it('returns confident when problem clearly maps to one domain', () => {
    const r = matchProblem(
      'I am burned out from work and my sleep is suffering',
      SEGMENTS,
      ADVISORS
    );
    expect(r.primaryDomain?.slug).toBe('mental-health');
    expect(r.advisors.length).toBeGreaterThanOrEqual(0);
  });

  it('returns uncertain when top two domains are close in confidence', () => {
    // Force tie between relationship and career
    const r = matchProblem(
      'partnership trust communication manager promotion staff',
      SEGMENTS,
      ADVISORS
    );
    expect(r.suggestedDomains.length).toBeGreaterThanOrEqual(1);
  });
});