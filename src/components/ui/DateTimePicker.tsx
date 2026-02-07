import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePickerNative from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

type PickerMode = 'date' | 'time' | 'datetime';

interface DateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: PickerMode;
  minimumDate?: Date;
  placeholder?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  placeholder,
  error,
  icon,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const formatDisplay = () => {
    if (!value) return placeholder || (mode === 'time' ? 'Select time' : 'Select date');
    switch (mode) {
      case 'date':
        return format(value, 'EEEE, MMMM d, yyyy');
      case 'time':
        return format(value, 'h:mm a');
      case 'datetime':
        return format(value, 'MMM d, yyyy h:mm a');
    }
  };

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
      return;
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const nativeMode = mode === 'datetime' ? 'datetime' : mode;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => {
          setTempDate(value || new Date());
          setShowPicker(true);
        }}
        activeOpacity={0.7}
      >
        {icon && (
          <Ionicons name={icon} size={20} color={colors.textTertiary} style={styles.icon} />
        )}
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {formatDisplay()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {/* iOS: Modal picker */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePickerNative
                value={tempDate}
                mode={nativeMode}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                textColor={colors.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android: inline picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePickerNative
          value={tempDate}
          mode={nativeMode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subheadline,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  triggerError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  triggerText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  error: {
    ...typography.caption1,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalDone: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
