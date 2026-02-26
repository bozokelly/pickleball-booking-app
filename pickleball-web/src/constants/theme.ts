export const colors = {
  // Brand — Slate Blue
  primary: '#4F6FA3', primaryLight: '#7A97C8', primaryDark: '#3A5585',
  // CTA — Emerald
  success: '#2ECC71', successDark: '#27AE60',
  // Semantic
  warning: '#FFA500', error: '#EF4444', info: '#6366F1',
  // Surfaces
  white: '#FFFFFF', surfaceTint: '#F2F5FB', background: '#EEF2F8',
  surface: '#FFFFFF', border: '#D8E0EE', separator: '#C4CDE0',
  // Typography
  textPrimary: '#1A1F2E', textSecondary: '#5C6478', textTertiary: '#94A0B8',
  disabled: '#C4CDE0',
  // Skill levels
  skillAll: '#86868B', skillBeginner: '#2ECC71', skillIntermediate: '#4F6FA3',
  skillAdvanced: '#E67E22', skillPro: '#E74C3C',
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
