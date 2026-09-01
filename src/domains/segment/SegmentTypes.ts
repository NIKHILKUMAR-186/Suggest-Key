export interface AdvisorySegment {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  tagline?: string;
  description: string;
  icon?: string;
  accent?: string;
  badge?: string;
  credentialBadgeLabel?: string;
  use_cases?: string[];
  audience?: string;
  advisor_types?: string | string[];
  what_to_expect?: string[];
  responsible_note?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;

  // Backwards-compatible properties
  roleTitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  iconName?: string;
  requiresCredentialVerification?: boolean;
  focusAreas?: string[];
  sampleQuestions?: string[];
  displayOrder?: number;
}

export interface SegmentMetrics {
  segmentId: string;
  segmentSlug: string;
  advisorCount: number;
  activeAdvisorCount: number;
  bookingsCount: number;
  revenueInr: number;
  totalAdvisorsCount?: number;
  totalBookingsCount?: number;
  totalRevenueInr?: number;
}

export const SEED_ADVISORY_SEGMENTS: AdvisorySegment[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Relationship Advisory',
    slug: 'relationship',
    short_description: 'Partnership calibration, interpersonal dynamics, family systems & high-stakes conflict resolution.',
    tagline: 'Build healthier, clearer and more meaningful relationships with structured guidance from experienced relationship professionals.',
    description: 'Whether you are navigating communication challenges, recurring conflict, changing relationship dynamics or family concerns, the right advisor can help you understand the situation and work toward clearer next steps.',
    icon: 'Heart',
    accent: '#ffb829',
    badge: 'LMFT & Certified Mediators',
    use_cases: [
      'Struggling with recurring conflict patterns or communication breakdowns',
      'Navigating a key relationship transition or pre-commitment decision',
      'Setting healthy boundaries and seeking neutral, objective perspective',
    ],
    audience: 'Individuals • Couples • Families',
    advisor_types: [
      'Licensed Marriage & Family Therapists (LMFT)',
      'Certified Gottman Method Practitioners',
      'Systemic Family & Interpersonal Mediators',
    ],
    what_to_expect: [
      '45-minute confidential video consultation',
      'Objective analysis of relationship loops and communication triggers',
      'Practical conversation frameworks and boundary templates',
    ],
    responsible_note: null,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Career Advisory',
    slug: 'career',
    short_description: 'Executive leadership, Staff+ trajectories, high-stakes compensation & strategic pivots.',
    tagline: 'Make clearer decisions about your professional direction, growth, leadership, and next career move.',
    description: 'From choosing your next career move to navigating leadership, interviews or professional transitions, career advisors provide structured perspective to help you move forward with confidence.',
    icon: 'Briefcase',
    accent: '#8052ff',
    badge: 'Executive Leaders & Directors',
    use_cases: [
      'Deciding between career paths or evaluating high-stakes job offers',
      'Aiming for promotion, executive leadership, or team scaling',
      'Preparing for strategic interviews and negotiating compensation',
    ],
    audience: 'Professionals • Leaders • Founders',
    advisor_types: [
      'VP & C-Suite Tech Operators (Ex-Meta, Uber, Stripe)',
      'Group Product Managers & Engineering Directors',
      'Certified Executive Coaches & Compensation Strategists',
    ],
    what_to_expect: [
      '1:1 diagnostic on career trajectory and positioning',
      'Executive resume, dossier, and promotion narrative review',
      'Live mock interviews and executive stakeholder pitching practice',
    ],
    responsible_note: null,
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Mental Health Advisory',
    slug: 'mental-health',
    short_description: 'Clinical psychology, executive burnout diagnostics, neuro-resilience & emotional calibration.',
    tagline: 'Find a trusted, confidential space for structured conversations around emotional wellbeing, stress, and resilience.',
    description: 'Some challenges are easier to navigate with the right support. Connect with appropriately qualified professionals for conversations around stress, emotional wellbeing and personal challenges.',
    icon: 'Brain',
    accent: '#15846e',
    badge: 'Licensed Clinical Psychologists',
    use_cases: [
      'Dealing with persistent stress, cognitive fatigue, or burnout',
      'Navigating a difficult personal or professional life transition',
      'Looking for structured emotional grounding and reflection tools',
    ],
    audience: 'Individuals • High-Stress Roles',
    advisor_types: [
      'Licensed Clinical Psychologists (Ph.D. / Psy.D.)',
      'Certified Cognitive Behavioral Therapy (CBT) Practitioners',
      'Neuro-Resilience & Somatic Stress Regulation Specialists',
    ],
    what_to_expect: [
      'Empathetic, confidential 1:1 exploratory consultations',
      'Evidence-based cognitive reframing and grounding protocols',
      'Actionable daily stress de-escalation routines',
    ],
    responsible_note: 'Advisory sessions provide structured guidance and reflective conversations. For medical emergencies or crisis care, please contact local emergency services immediately.',
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_SEED_SEGMENTS = SEED_ADVISORY_SEGMENTS;

export const AdvisorySegmentSlug = {
  Relationship: 'relationship',
  Career: 'career',
  MentalHealth: 'mental-health',
} as const;
export type AdvisorySegmentSlug = (typeof AdvisorySegmentSlug)[keyof typeof AdvisorySegmentSlug];

