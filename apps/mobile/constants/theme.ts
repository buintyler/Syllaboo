/**
 * Syllaboo Design Tokens
 * Single source of truth for all colors, typography, spacing, and layout values.
 * Never hardcode raw values in components — always import from here.
 * To rebrand or update the design system, change values here only.
 */

export const colors = {
  bg: {
    primary: '#FFF8F0',    // Warm cream — main app background
    secondary: '#FFF3E6',  // Slightly deeper cream — card backgrounds
    surface: '#FFFFFF',    // White — elevated cards, modals, input fields
    reading: '#FFF8F0',    // Reading session background
  },
  brand: {
    primary: '#93D4EC',       // Light baby blue — primary buttons, CTAs, highlights
    primaryDark: '#7EC8E3',   // Darker blue — pressed state
    secondary: '#7ECEC1',     // Soft teal — secondary actions, accents
    secondaryDark: '#5EBDB0', // Darker teal — pressed state
    accent: '#FF6B6B',        // Coral — error states, mispronounced words
  },
  text: {
    primary: '#2D2D2D',   // Near-black — headings, body text
    secondary: '#6B7280', // Medium gray — labels, helper text
    disabled: '#B0B0B0',  // Light gray — disabled states
    onBrand: '#FFFFFF',   // White — text on brand-colored buttons
    reading: '#1A1A2E',   // Dark navy — story text (high contrast)
  },
  state: {
    success: '#4CAF50',   // Green — correct words, achievements
    warning: '#FFC107',   // Yellow — partial matches
    error: '#FF6B6B',     // Coral — mispronounced words
    highlight: '#FFD93D', // Bright yellow — current word highlight
    locked: '#D4C5A9',    // Muted gold — lock icon overlay
  },
  child: {
    starGold: '#FFD700',    // Stars, XP indicators
    levelPurple: '#9B59B6', // Level badges
    streakOrange: '#FF8C42',// Streak badges
    badgeBg: '#F0E6FF',     // Light purple — badge backgrounds
  },
  border: {
    light: '#F0EDE8',  // Subtle dividers
    input: '#E5E7EB',  // Input field borders
  },
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: '800' as const, lineHeight: 44, letterSpacing: 1 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
  reading: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 48,
    letterSpacing: 0.5,
  },
  readingHighlight: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 48,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const layout = {
  screenPadding: 20,
  cardBorderRadius: 16,
  buttonBorderRadius: 28,        // Pill — child UI
  buttonBorderRadiusParent: 12,  // Softer — parent UI
  inputBorderRadius: 12,
  avatarSize: {
    small: 40,
    medium: 64,
    large: 120,
  },
  tabBarHeight: 80,
  minTapTarget: 44,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#93D4EC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const levelColors = {
  1: '#4CAF50', // Green
  2: '#FFC107', // Yellow
  3: '#FF8C42', // Orange
  4: '#FF6B8A', // Pink
  5: '#9B59B6', // Purple
} as const;
