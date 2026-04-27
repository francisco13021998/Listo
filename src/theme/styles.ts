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
    ...tokens.typography.title,
    color: tokens.colors.text,
  },
  subtitle: {
    ...tokens.typography.subtitle,
    color: tokens.colors.textMuted,
  },
  body: {
    ...tokens.typography.body,
    color: tokens.colors.text,
  },
  caption: {
    ...tokens.typography.caption,
    color: tokens.colors.textMuted,
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
