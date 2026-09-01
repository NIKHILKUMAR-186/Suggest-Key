/**
 * Suggest Key Design Tokens
 * Source of Truth: DESIGN.md
 */

export const colors = {
  void: '#000000',
  boneWhite: '#ffffff',
  ashGray: '#9a9a9a',
  silverMist: '#bdbdbd',
  electricIris: '#8052ff',
  saffronSpark: '#ffb829',
  deepVerdant: '#15846e',
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, 'PPNeueMontreal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  scale: {
    display: {
      fontSize: 'clamp(52px, 8vw, 113px)',
      lineHeight: '1.1',
      letterSpacing: '-4.52px',
      fontWeight: '400',
    },
    headingLg: {
      fontSize: 'clamp(38px, 6vw, 78px)',
      lineHeight: '1.1',
      letterSpacing: '-3.12px',
      fontWeight: '400',
    },
    heading: {
      fontSize: 'clamp(32px, 4.5vw, 48px)',
      lineHeight: '1.1',
      letterSpacing: '-1.68px',
      fontWeight: '400',
    },
    headingSm: {
      fontSize: 'clamp(28px, 3.5vw, 42px)',
      lineHeight: '1.2',
      letterSpacing: '-1.68px',
      fontWeight: '400',
    },
    subheading: {
      fontSize: 'clamp(24px, 3vw, 36px)',
      lineHeight: '1.2',
      letterSpacing: '-0.8px',
      fontWeight: '400',
    },
    headingXs: {
      fontSize: '27px',
      lineHeight: '1.2',
      letterSpacing: '-0.5px',
      fontWeight: '400',
    },
    heading2Xs: {
      fontSize: '24px',
      lineHeight: '1.25',
      letterSpacing: '-0.48px',
      fontWeight: '400',
    },
    body: {
      fontSize: '18px',
      lineHeight: '1.5',
      fontWeight: '200',
    },
    navLabel: {
      fontSize: '14px',
      lineHeight: '1.2',
      letterSpacing: '0.35px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '1.5',
      fontWeight: '400',
    },
  },
} as const;

export const spacing = {
  6: '6px',
  12: '12px',
  18: '18px',
  24: '24px',
  30: '30px',
  36: '36px',
  60: '60px',
  96: '96px',
  120: '120px',
} as const;

export const radius = {
  card: '24px',
  button: '24px',
  nav: '24px',
  tag: '9999px',
} as const;

export const layout = {
  pageMaxWidth: '1280px',
  sectionGap: '80px',
} as const;
