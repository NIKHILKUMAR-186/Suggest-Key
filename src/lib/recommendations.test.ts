import { describe, it, expect } from 'vitest';
import {
  RecommendationEngine,
  formatRecommendationScore,
  RecommendOptions,
} from './recommendations';
import { AdvisorDetail } from '../domains/advisor/AdvisorService';
import { AdvisorySegment } from '../domains/segment/SegmentTypes';

const SEGMENTS: AdvisorySegment[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Relationship Advisory',
    slug: 'relationship',
    short_description: 'Relationship guidance',
    description: 'Full description',
    icon: 'Heart',
    accent: '#ffb829',
    badge: 'LMFT & Certified Mediators',
    use_cases: [
      'Struggling with recurring conflict patterns or communication breakdowns',
      'Navigating a key relationship transition or pre-commitment decision',
      'Setting healthy boundaries and seeking neutral, objective perspective',
    ],
    audience: 'Individuals • Couples • Families',
    advisor_types: ['Licensed Marriage & Family Therapists (LMFT)'],
    what_to_expect: ['45-minute confidential video consultation'],
    responsible_note: null,
    is_active: true,
    display_order: 1,
    created_at: '2026-09-01T10:09:23.514Z',
    updated_at: '2026-09-01T10:14:25.036Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Career Advisory',
    slug: 'career',
    short_description: 'Career guidance',
    description: 'Full description',
    icon: 'Briefcase',
    accent: '#8052ff',
    badge: 'Executive Leaders & Directors',
    use_cases: [
      'Deciding between career paths or evaluating high-stakes job offers',
      'Aiming for promotion, executive leadership, or team scaling',
    ],
    audience: 'Professionals • Leaders • Founders',
    advisor_types: ['VP & C-Suite Tech Operators'],
    what_to_expect: ['1:1 diagnostic on career trajectory'],
    responsible_note: null,
    is_active: true,
    display_order: 2,
    created_at: '2026-09-01T10:09:23.514Z',
    updated_at: '2026-09-01T10:14:25.036Z',
  },
];

function makeAdvisor(overrides: Partial<AdvisorDetail> = {}): AdvisorDetail {
  return {
    id: 'test-mentor-1',
    headline: 'Licensed Clinical Psychologist & Executive Burnout Specialist',
    bio: 'Test bio for the mentor.',
    experience_years: 14,
    rating: 4.98,
    review_count: 54,
    verification_status: 'approved',
    verified_categories: ['mental-health'],
    segment_id: '00000000-0000-0000-0000-000000000003',
    credentials_url: 'https://credentials.suggestkey.internal/test.pdf',
    credentials_verified_at: '2025-01-15T10:00:00Z',
    specialties: ['Burnout Diagnostics', 'Decision Fatigue'],
    is_demo: false,
    created_at: '2024-11-01T08:00:00Z',
    profile: {
      id: 'test-mentor-1',
      email: 'test@example.com',
      full_name: 'Dr. Test Mentor',
      avatar_url: 'https://example.com/avatar.jpg',
      role: 'mentor',
      is_anonymous_enabled: false,
      created_at: '2024-11-01T08:00:00Z',
      updated_at: '2025-02-01T12:00:00Z',
    },
    ...overrides,
  } as AdvisorDetail;
}

describe('RecommendationEngine', () => {
  describe('recommend', () => {
    it('returns advisors sorted by score descending', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ id: 'low', rating: 4.5, review_count: 5, experience_years: 5 }),
        makeAdvisor({ id: 'mid', rating: 4.8, review_count: 20, experience_years: 10 }),
        makeAdvisor({ id: 'high', rating: 4.95, review_count: 80, experience_years: 15 }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 3,
      });

      expect(results).toHaveLength(3);
      expect(results[0]!.advisor.id).toBe('high');
      expect(results[1]!.advisor.id).toBe('mid');
      expect(results[2]!.advisor.id).toBe('low');

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]!.score).toBeGreaterThanOrEqual(
          results[i + 1]!.score
        );
      }
    });

    it('respects the limit parameter', () => {
      const advisors: AdvisorDetail[] = Array.from({ length: 10 }, (_, i) =>
        makeAdvisor({ id: `mentor-${i}`, rating: 4.9, review_count: 50 })
      );

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 3,
      });

      expect(results).toHaveLength(3);
    });

    it('filters out non-approved mentors', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ id: 'approved', verification_status: 'approved' }),
        makeAdvisor({ id: 'pending', verification_status: 'pending' }),
        makeAdvisor({ id: 'suspended', verification_status: 'suspended' }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.advisor.id).toBe('approved');
    });

    it('filters by minRating', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ id: 'high', rating: 4.9 }),
        makeAdvisor({ id: 'low', rating: 3.5 }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 10,
        minRating: 4.0,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.advisor.id).toBe('high');
    });

    it('filters by minReviewCount', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ id: 'many', review_count: 50 }),
        makeAdvisor({ id: 'few', review_count: 2 }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 10,
        minReviewCount: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.advisor.id).toBe('many');
    });

    it('filters by preferred segment', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({
          id: 'career-mentor',
          verified_categories: ['career'],
          segment_id: '00000000-0000-0000-0000-000000000002',
        }),
        makeAdvisor({
          id: 'relationship-mentor',
          verified_categories: ['relationship'],
          segment_id: '00000000-0000-0000-0000-000000000001',
        }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        preferredSegmentSlug: 'career',
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.advisor.id).toBe('career-mentor');
      expect(results[0]!.segmentMatch).toBe(true);
    });

    it('does not match preferred segment for non-matching advisors', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({
          id: 'career-mentor',
          verified_categories: ['career'],
          segment_id: '00000000-0000-0000-0000-000000000002',
        }),
        makeAdvisor({
          id: 'mental-mentor',
          verified_categories: ['mental-health'],
          segment_id: '00000000-0000-0000-0000-000000000003',
        }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        preferredSegmentSlug: 'career',
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.advisor.id).toBe('career-mentor');
    });

    it('produces explainable reasons for each entry', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ id: 'mentor-1' }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.reasons.length).toBeGreaterThan(0);
      expect(results[0]!.reasons.some((r) => r.includes('reviews'))).toBe(true);
      expect(results[0]!.reasons.some((r) => r.includes('years'))).toBe(true);
      expect(results[0]!.reasons.some((r) => r.includes('verified'))).toBe(true);
    });

    it('includes matched use cases when segment matches', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({
          id: 'career-mentor',
          verified_categories: ['career'],
          segment_id: '00000000-0000-0000-0000-000000000002',
        }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        preferredSegmentSlug: 'career',
        limit: 10,
      });

      expect(results[0]!.matchedUseCases.length).toBeGreaterThan(0);
    });

    it('returns empty array for empty input', () => {
      const results = RecommendationEngine.recommend([], SEGMENTS, {
        limit: 10,
      });

      expect(results).toHaveLength(0);
    });

    it('computes confidence between 0.5 and 0.99', () => {
      const advisors: AdvisorDetail[] = [
        makeAdvisor({ review_count: 10, experience_years: 5 }),
        makeAdvisor({ review_count: 100, experience_years: 20 }),
      ];

      const results = RecommendationEngine.recommend(advisors, SEGMENTS, {
        limit: 10,
      });

      for (const entry of results) {
        expect(entry.confidence).toBeGreaterThanOrEqual(0.5);
        expect(entry.confidence).toBeLessThanOrEqual(0.99);
      }
    });
  });
});

describe('formatRecommendationScore', () => {
  it('returns "Exceptional" for scores >= 90%', () => {
    const entry = {
      advisor: makeAdvisor(),
      score: 0.95,
      confidence: 0.9,
      reasons: ['test'],
      matchedUseCases: [],
      segmentMatch: true,
    };
    expect(formatRecommendationScore(entry)).toContain('Exceptional');
  });

  it('returns "Strong" for scores >= 70%', () => {
    const entry = {
      advisor: makeAdvisor(),
      score: 0.75,
      confidence: 0.9,
      reasons: ['test'],
      matchedUseCases: [],
      segmentMatch: true,
    };
    expect(formatRecommendationScore(entry)).toContain('Strong');
  });

  it('includes percentage in output', () => {
    const entry = {
      advisor: makeAdvisor(),
      score: 0.85,
      confidence: 0.9,
      reasons: ['test'],
      matchedUseCases: [],
      segmentMatch: true,
    };
    const result = formatRecommendationScore(entry);
    expect(result).toMatch(/\d+%/);
  });
});
