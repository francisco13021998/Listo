import { StyleSheet } from 'react-native';
import { tokens } from './tokens';

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  screenContent: {
    paddingBottom: tokens.spacing.xl,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: tokens.colors.text,
    ...tokens.typography.title,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    ...tokens.typography.subtitle,
  },
  body: {
    color: tokens.colors.text,
    ...tokens.typography.body,
  },
  caption: {
    color: tokens.colors.textMuted,
    ...tokens.typography.caption,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
  },
  mutedSurface: {
    backgroundColor: tokens.colors.surfaceMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gapSm: {
    gap: tokens.spacing.sm,
  },
  gapMd: {
    gap: tokens.spacing.md,
  },
  border: {
    borderColor: tokens.colors.border,
  },
  danger: {
    color: tokens.colors.danger,
  },
  success: {
    color: tokens.colors.success,
  },
});
