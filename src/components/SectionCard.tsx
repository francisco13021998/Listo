import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  title: {
    color: tokens.colors.text,
    fontSize: tokens.typography.subtitle.fontSize,
    fontWeight: tokens.typography.subtitle.fontWeight,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
  },
});