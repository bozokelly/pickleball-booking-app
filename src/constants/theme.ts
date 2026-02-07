/**
 * Apple-inspired design system for Pickleball Booking App.
 *
 * Colors follow iOS system colors. Typography uses SF Pro Display weights
 * (system default on iOS, falls back to system font on Android).
 */

export const colors = {
  // Primary brand
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0055CC',

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5856D6',

  // Neutrals
  white: '#FFFFFF',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  border: '#E5E5EA',
  separator: '#C6C6C8',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  disabled: '#D1D1D6',

  // Skill level badges
  skillAll: '#8E8E93',
  skillBeginner: '#34C759',
  skillIntermediate: '#007AFF',
  skillAdvanced: '#FF9500',
  skillPro: '#FF3B30',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export const SKILL_LEVEL_COLORS: Record<string, string> = {
  all: colors.skillAll,
  beginner: colors.skillBeginner,
  intermediate: colors.skillIntermediate,
  advanced: colors.skillAdvanced,
  pro: colors.skillPro,
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  all: 'All Levels',
  beginner: 'Beginner (2.0-3.0)',
  intermediate: 'Intermediate (3.0-4.0)',
  advanced: 'Advanced (4.0-5.0)',
  pro: 'Pro (5.0+)',
};

export const GAME_FORMAT_LABELS: Record<string, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed_doubles: 'Mixed Doubles',
  round_robin: 'Round Robin',
  open_play: 'Open Play',
};
