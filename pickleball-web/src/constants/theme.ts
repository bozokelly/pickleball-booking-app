export const colors = {
  // Brand — near-black (iOS label)
  primary: '#1C1C1E', primaryLight: '#48484A', primaryDark: '#000000',
  // Accent — iOS system blue
  accent: '#007AFF',
  // Semantic — iOS system colours
  success: '#34C759', successDark: '#248A3D',
  warning: '#FF9500', error: '#FF3B30', info: '#007AFF',
  // Surfaces
  white: '#FFFFFF', surfaceTint: '#F9F9F9', background: '#F2F2F7',
  surface: '#FFFFFF', border: '#E5E5EA', separator: '#C6C6C8',
  // Typography — iOS label hierarchy
  textPrimary: '#1C1C1E', textSecondary: '#8E8E93', textTertiary: '#AEAEB2',
  disabled: '#C7C7CC',
  // Skill levels — iOS-native palette
  skillAll: '#8E8E93', skillBeginner: '#34C759', skillIntermediate: '#007AFF',
  skillAdvanced: '#FF9500', skillPro: '#FF3B30',
} as const;

export const SKILL_LEVEL_COLORS: Record<string, string> = {
  all: colors.skillAll, beginner: colors.skillBeginner, intermediate: colors.skillIntermediate,
  advanced: colors.skillAdvanced, pro: colors.skillPro,
};
export const SKILL_LEVEL_LABELS: Record<string, string> = {
  all: 'All Levels', beginner: 'Beginner (2.0-3.0)', intermediate: 'Intermediate (3.0-4.0)',
  advanced: 'Advanced (4.0-5.0)', pro: 'Pro (5.0+)',
};
export const GAME_FORMAT_LABELS: Record<string, string> = {
  singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles',
  round_robin: 'Round Robin', open_play: 'Open Play',
};

// iOS-style club avatar colours (used for initials placeholders)
export const CLUB_AVATAR_COLORS = [
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#34C759', '#00C7BE',
];
