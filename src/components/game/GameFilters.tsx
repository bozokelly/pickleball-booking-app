import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkillLevel, GameFormat } from '@/types/database';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  SKILL_LEVEL_LABELS,
  GAME_FORMAT_LABELS,
  SKILL_LEVEL_COLORS,
} from '@/constants/theme';

export interface GameFilterState {
  search: string;
  skillLevel: SkillLevel | null;
  gameFormat: GameFormat | null;
}

interface GameFiltersProps {
  filters: GameFilterState;
  onChange: (filters: GameFilterState) => void;
}

const SKILL_LEVELS = Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[];
const GAME_FORMATS = Object.keys(GAME_FORMAT_LABELS) as GameFormat[];

export function GameFilters({ filters, onChange }: GameFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = filters.skillLevel !== null || filters.gameFormat !== null;

  const clearFilters = () => {
    onChange({ search: filters.search, skillLevel: null, gameFormat: null });
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search games, clubs, locations..."
          placeholderTextColor={colors.textTertiary}
          value={filters.search}
          onChangeText={(text) => onChange({ ...filters, search: text })}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {filters.search.length > 0 && (
          <TouchableOpacity onPress={() => onChange({ ...filters, search: '' })}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={[styles.filterToggle, hasActiveFilters && styles.filterToggleActive]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      {expanded && (
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {SKILL_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() =>
                      onChange({
                        ...filters,
                        skillLevel: filters.skillLevel === level ? null : level,
                      })
                    }
                    style={[
                      styles.chip,
                      filters.skillLevel === level && {
                        backgroundColor: SKILL_LEVEL_COLORS[level] + '20',
                        borderColor: SKILL_LEVEL_COLORS[level],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.skillLevel === level && {
                          color: SKILL_LEVEL_COLORS[level],
                        },
                      ]}
                    >
                      {SKILL_LEVEL_LABELS[level]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Format</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {GAME_FORMATS.map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    onPress={() =>
                      onChange({
                        ...filters,
                        gameFormat: filters.gameFormat === fmt ? null : fmt,
                      })
                    }
                    style={[
                      styles.chip,
                      filters.gameFormat === fmt && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.gameFormat === fmt && styles.chipTextSelected,
                      ]}
                    >
                      {GAME_FORMAT_LABELS[fmt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  filterToggle: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  filterToggleActive: {
    backgroundColor: colors.primary + '15',
  },
  filterSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  filterRow: {
    gap: spacing.xs,
  },
  filterLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.footnote,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  clearText: {
    ...typography.footnote,
    color: colors.error,
    fontWeight: '500',
  },
});
