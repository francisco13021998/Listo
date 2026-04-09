export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF7F0',
  text: '#111827',
  textMuted: '#6B7280',
  primary: '#176B3A',
  primaryDark: '#176B3A',
  primarySoft: '#E7F6ED',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#176B3A',
  successSoft: '#DCEFE2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
    lineHeight: 20,
  },
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
} as const;
