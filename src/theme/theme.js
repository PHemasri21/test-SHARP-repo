import { Platform } from 'react-native';

export const THEME = {
  colors: {
    background: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceSubtle: '#EEF2F8',
    primary: '#2563EB',
    primarySoft: '#DBEAFE',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    border: '#E2E8F0',
    successBg: '#DCFCE7',
    successText: '#166534',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    dangerBg: '#FEE2E2',
    dangerText: '#991B1B',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  elevation: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
};