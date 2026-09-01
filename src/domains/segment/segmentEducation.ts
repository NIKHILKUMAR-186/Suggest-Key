import { AdvisorySegment } from './SegmentTypes';
import { SegmentService } from './SegmentService';

export interface SegmentEducationData {
  id: string;
  slug: string;
  title: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  iconName: string;
  tagline: string;
  description: string;
  audience: string;
  focusTopics: string[];
  isThisForYou: string[];
  whoYouWillFind: {
    description: string;
    badge: string;
  };
  whatToExpect: string[];
  responsibleNote?: string | null;
}

export class SegmentEducationService {
  /**
   * Convert any dynamic database AdvisorySegment into presentation-ready educational data
   */
  static fromSegment(segment: AdvisorySegment): SegmentEducationData {
    const accent = segment.accent || '#8052ff';
    const topics = Array.isArray(segment.use_cases) && segment.use_cases.length > 0
      ? segment.use_cases.slice(0, 6)
      : ['1:1 Strategic Advisory', 'High-Trust Consultations', 'Structured Guidance'];

    const advisorTypesDesc = segment.advisor_types
      ? `${segment.advisor_types} with verified credentials and audited track-records.`
      : `Audited specialists in ${segment.name} with verified credentials.`;

    return {
      id: segment.id,
      slug: segment.slug,
      title: segment.name,
      badge: segment.advisor_types || `${segment.name} Verified`,
      badgeColor: `border-white/20 bg-white/5 text-white`,
      accentColor: accent,
      iconName: segment.icon || 'Sparkles',
      tagline: segment.short_description || segment.description,
      description: segment.description,
      audience: segment.audience || 'Seekers & Professionals',
      focusTopics: topics,
      isThisForYou: Array.isArray(segment.use_cases) && segment.use_cases.length > 0
        ? segment.use_cases
        : [
            `Seeking private, 1:1 guidance in ${segment.name}`,
            'Navigating high-stakes decisions with structured support',
            'Looking for vetted practitioner perspective and actionable takeaways',
          ],
      whoYouWillFind: {
        description: advisorTypesDesc,
        badge: segment.advisor_types || '100% Audited',
      },
      whatToExpect: [
        '45-minute confidential 1:1 video consultation',
        'Actionable strategic takeaway frameworks',
        'Safe escrow payment protection',
      ],
    };
  }

  /**
   * Fetch educational data asynchronously from database
   */
  static async getEducationData(slugOrId?: string): Promise<SegmentEducationData> {
    if (!slugOrId || slugOrId === 'all') {
      return this.getAllDomainsData();
    }

    const segment = await SegmentService.getSegmentBySlug(slugOrId);
    if (segment) {
      return this.fromSegment(segment);
    }

    return this.getAllDomainsData();
  }

  static getAllDomainsData(): SegmentEducationData {
    return {
      id: 'all',
      slug: 'all',
      title: 'All Advisory Domains',
      badge: 'Audited Specialists',
      badgeColor: 'text-white/80 border-white/20 bg-white/5',
      accentColor: '#8052ff',
      iconName: 'Sparkles',
      tagline:
        'Connect with vetted domain specialists for 1:1 structured guidance across relationships, career, emotional wellbeing, and beyond.',
      description:
        'Explore verified practitioners, executive operators, and certified advisors across all active domains on Suggest Key.',
      audience: 'Seekers, Leaders & Individuals',
      focusTopics: [
        'Relationship & Family',
        'Career Strategy & Growth',
        'Stress & Wellbeing',
        'Leadership & Direction',
      ],
      isThisForYou: [
        'Looking for high-trust, 1:1 advisory from audited domain authorities',
        'Navigating key transitions with structured, private consultations',
        'Seeking actionable roadmaps backed by escrow session protection',
      ],
      whoYouWillFind: {
        description:
          'Audited domain authorities including licensed therapists, tech executives, certified coaches, and clinicians.',
        badge: '100% Verified',
      },
      whatToExpect: [
        '45-minute confidential 1:1 video consultation',
        'Direct perspective from vetted domain leaders',
        'Escrow payment release upon completion',
      ],
    };
  }
}
