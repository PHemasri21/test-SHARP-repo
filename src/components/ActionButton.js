import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../theme/theme';

const DEFAULT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export default function ActionButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  hitSlop = DEFAULT_HIT_SLOP,
}) {
  const isInactive = disabled || loading;

  const variantContainerStyle =
    variant === 'secondary'
      ? styles.secondaryBtn
      : variant === 'danger'
        ? styles.dangerBtn
        : styles.primaryBtn;

  const variantTextStyle =
    variant === 'secondary'
      ? styles.secondaryText
      : variant === 'danger'
        ? styles.dangerText
        : styles.primaryText;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.75}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.baseBtn,
        variantContainerStyle,
        isInactive && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? THEME.colors.primary : '#FFFFFF'}
        />
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.baseText, variantTextStyle, textStyle]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    minHeight: 48,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
  },
  secondaryBtn: {
    backgroundColor: THEME.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dangerBtn: {
    backgroundColor: THEME.colors.dangerText,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: THEME.colors.primary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
});