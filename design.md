---
name: Suggest Key Landing Page
description: A dark, iridescent landing page for matching seekers with verified advisors through real lived experience.
colors:
  void: "#050507"
  frost: "#f5f4fa"
  mist: "#c2c2cc"
  ash: "#9a9a9a"
  silver: "#bdbdbd"
  electricIris: "#8052ff"
  irisLight: "#a07cff"
  irisHover: "#6c3df0"
  deepVerdant: "#15846e"
  tealBright: "#2dd4bf"
  cyanTeal: "#22d3ee"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(42px, 6vw, 68px)"
    lineHeight: 1.02
    letterSpacing: "-0.035em"
    fontWeight: 400
  heading:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(32px, 4.5vw, 48px)"
    lineHeight: 1.1
    letterSpacing: "-0.035em"
    fontWeight: 400
  headingSm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(28px, 3.5vw, 42px)"
    lineHeight: 1.2
    letterSpacing: "-0.035em"
    fontWeight: 400
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
    fontWeight: 300
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    lineHeight: 1.2
    letterSpacing: "0.2em"
    fontWeight: 600
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
    fontWeight: 400
rounded:
  card: "24px"
  panel: "24px"
  icon: "16px"
  iconSm: "12px"
  pill: "999px"
  cta: "32px"
spacing:
  pageGutter: "24px"
  section: "64px"
  sectionLarge: "96px"
  cardGap: "16px"
  cardGapLg: "24px"
  navHeight: "80px"
components:
  button-primary:
    backgroundColor: "{colors.electricIris}"
    textColor: "{colors.frost}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "16px 40px"
  button-primary-hover:
    backgroundColor: "{colors.irisHover}"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.frost}"
    rounded: "{rounded.pill}"
    padding: "16px 40px"
  input-search:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.frost}"
    rounded: "{rounded.pill}"
    padding: "16px 16px 16px 44px"
    height: "52px"
  card:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.frost}"
    rounded: "{rounded.card}"
    padding: "24px"
  chip:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.mist}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  nav:
    backgroundColor: "rgba(0, 0, 0, 0.8)"
    textColor: "{colors.ash}"
    typography: "{typography.label}"
    height: "{spacing.navHeight}"
    padding: "20px 24px"
---

# Design System: Suggest Key Landing Page

## Overview

**Creative North Star: "The Luminous Crossing"**

The landing page lives on a near-black canvas, using translucent surfaces and iridescent accents to convey depth without heavy shadows. The identity is built around a journey metaphor: a bridge crossed by people with lived experience. The tone is calm, editorial, and trust-forward—saturated color appears only at decision points (CTAs, active states, verification marks) so its rarity carries meaning.

**Key Characteristics:**
- Dark void base with translucent layered panels
- Iris primary accent with verdant trust signals
- Pill-shaped actions and full-bleed rounded containers
- Tight negative tracking on headlines, wide tracking on labels
- Scroll-driven path and node animations, reduced-motion safe

## Colors

### Primary
- **Electric Iris** (#8052ff): Primary actions, active links, and focus treatments. Used sparingly to preserve emphasis.
- **Iris Light** (#a07cff): Secondary accent text, hover states, and node highlights.
- **Iris Hover** (#6c3df0): Primary button hover state.

### Secondary
- **Deep Verdant** (#15846e): Trust, verification, and safety signals.
- **Teal Bright** (#2dd4bf): Success states, active checkmarks, and verification progress.
- **Cyan Teal** (#22d3ee): Decision-path accent and directional highlights.
- **Saffron Spark** (#ffb829): Attention accents for ratings and advisory metadata.

### Neutral
- **Void** (#050507): Page and section background.
- **Frost** (#f5f4fa): Primary text and high-emphasis headings.
- **Mist** (#c2c2cc): Secondary body text and card descriptions.
- **Ash** (#9a9a9a): Tertiary text, captions, and idle nav states.
- **Silver** (#bdbdbd): Supporting body text in editorial contexts.

### Named Rules
**The Translucent Surface Rule.** All cards, panels, and overlays use white at 2–6% opacity over the void. No solid gray or white cards are introduced.

**The Accent Chroma Rule.** Saturated accents are reserved for active states, CTAs, and trust marks. A single card should never carry more than one saturated color.

## Typography

**Display Font:** Inter with system fallbacks.  
**Character:** Neutral, highly legible, and dense. Negative tracking on headlines compresses them into a confident editorial rhythm; positive tracking on labels creates telegraphic, scan-friendly metadata.

### Hierarchy
- **Display** (400, clamp(42px, 6vw, 68px), 1.02): Hero headline. Appears once per viewport.
- **Heading** (400, clamp(32px, 4.5vw, 48px), 1.1): Section titles.
- **Heading Sm** (400, clamp(28px, 3.5vw, 42px), 1.2): Tight-section headers and sticky column titles.
- **Body** (300, 15px, 1.6): Section descriptions and card copy.
- **Label** (600, 11px, 1.2, 0.2em): Eyebrows, nav items, and section labels. Uppercase by default.
- **Caption** (400, 12px, 1.5): Helper text, metadata, and card footnotes.

### Named Rules
**The Heading Compression Rule.** Headlines use light weight with tight negative letter-spacing. Do not increase weight or tracking on headings—spaciousness comes from size and rhythm, not looseness.

## Layout

The page uses a fixed max-width container of 1280px centered with 24px gutters. Sections alternate asymmetric grids (e.g., hero at 1.15fr / 0.85fr) and stacked single-column layouts depending on content density. Sticky left columns keep section context visible while right-side cards scroll.

Vertical rhythm is generous: sections typically separate with 64px on small screens and 96px on larger viewports. Card grids use 16–24px gaps, with tighter gaps inside advisors grids and looser spacing in explanatory panels.

## Elevation & Depth

The system is flat by default. Depth is conveyed through translucent white surfaces (2–6% opacity), backdrop blur, and subtle 1px white borders at 10–15% opacity. Structural shadows are intentionally absent. Colored glow shadows appear only on primary CTAs to reinforce action without adding visual weight.

### Shadow Vocabulary
- **Primary glow** (`0 8px 32px -8px rgba(128,82,255,0.6)`): Used exclusively on primary action buttons.
- **Nav shadow** (`0 1px 0 rgba(255,255,255,0.05)` implicit via border): Fixed navigation uses a bottom border rather than a shadow.

### Named Rules
**The Floating Surface Rule.** Panels and cards should feel like they are hovering over the void through translucency and blur. Never introduce solid gray surfaces or heavy drop shadows.

## Shapes

- **Pill** (999px): Primary actions, search inputs, and selectable chips.
- **Card** (24px): Large panels, advisor cards, CTA containers, and section backgrounds.
- **Panel** (24px): Metric containers and section wrappers.
- **Icon** (16px): Icon containers, avatar frames, and small badges.
- **Icon Sm** (12px): Compact inline icons and verification badges.
- **CTA** (32px): The hero CTA container uses a larger radius to separate it from standard cards.

Recurring geometry includes perfect circles for node markers, verification badges, and brand marks. Sharp radial gradients under CTA sections add a soft halo without changing surface shape.

## Components

### Buttons
- **Shape:** Pill.
- **Primary:** Electric iris fill, frost text, uppercase label tracking. 16px 40px padding. Hover shifts to irisHover with a subtle lift.
- **Secondary:** Translucent white fill with soft border. Same padding and shape as primary. No shadow.
- **Ghost:** Transparent with ash text, white on hover. Used for tertiary actions.

### Chips
- **Style:** Translucent white fill with subtle border. Mist text, uppercase tracking.
- **State:** Selected or active chips switch to electric iris with matching border and background tint.

### Cards / Containers
- **Corner Style:** 24px radius.
- **Background:** White at 3% opacity.
- **Border:** White at 10% opacity; active or hover states raise border opacity or tint with iris.
- **Shadow Strategy:** No box-shadow. Depth comes from background opacity and backdrop blur.
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style:** Pill shape, translucent white background, subtle white border.
- **Focus:** Iris border with matching soft ring.
- **Placeholder:** Ash gray at reduced opacity.

### Navigation
- **Style:** Fixed top bar with translucent black background and blur. Max-width 1280px, 80px tall.
- **Typography:** Uppercase labels in 11px with wide tracking. Inactive links are ash gray; active links are frost white.
- **Mobile:** Hamburger opens a full-width drawer with stacked uppercase links and stacked CTAs.

### Signature Components
- **Journey Path:** A decorative, scroll-linked SVG path that draws itself and pulses nodes. Uses the iris gradient with soft glow filters. Reduced motion disables animation entirely.
- **Scroll Reveal:** Sections fade up through IntersectionObserver with an ease-out curve. Fallback timeout ensures visibility after 3.5s.

## Do's and Don'ts

### Do:
- **Do** keep the background near-black (#050507) across all public surfaces.
- **Do** use pill shapes for every primary and secondary action.
- **Do** preserve translucent card backgrounds instead of introducing solid grays.
- **Do** tighten headline letter-spacing; loosen only label tracking.
- **Do** reserve electric iris for actions, active states, and focus rings.

### Don't:
- **Don't** use multiple saturated accents within a single card or panel.
- **Don't** add solid white or light-gray surfaces; depth should come from opacity layers.
- **Don't** reduce label tracking below 0.14em or raise headline weight above 400.
- **Don't** replace rounded-3xl containers with sharper corners on desktop panels.
- **Don't** introduce heavy box-shadows; rely on blur and translucency for elevation.