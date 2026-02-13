export const colors = {
  primary: '#007AFF', primaryLight: '#4DA3FF', primaryDark: '#0055CC',
  success: '#34C759', warning: '#FF9500', error: '#FF3B30', info: '#5856D6',
  white: '#FFFFFF', background: '#F2F2F7', surface: '#FFFFFF',
  border: '#E5E5EA', separator: '#C6C6C8',
  textPrimary: '#000000', textSecondary: '#8E8E93', textTertiary: '#AEAEB2',
  disabled: '#D1D1D6',
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
