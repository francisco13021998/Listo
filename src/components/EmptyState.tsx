import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { tokens } from '../theme/tokens';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  title,
  subtitle,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const detail = subtitle ?? message;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.message}>{detail}</Text> : null}
      {actionLabel || secondaryActionLabel ? (
        <View style={styles.actions}>
          {actionLabel ? <PrimaryButton title={actionLabel} onPress={onAction} fullWidth /> : null}
          {secondaryActionLabel ? (
            <SecondaryButton title={secondaryActionLabel} onPress={onSecondaryAction} fullWidth />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.subtitle.fontSize,
    fontWeight: tokens.typography.subtitle.fontWeight,
    color: tokens.colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: tokens.typography.caption.fontSize,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: tokens.typography.caption.lineHeight,
  },
  actions: {
    width: '100%',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
});
