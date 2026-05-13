import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

interface PaginatorProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function Paginator({ currentPage, totalPages, onPrevious, onNext }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        onPress={onPrevious}
        disabled={!hasPrev}
        style={({ pressed }) => [styles.button, !hasPrev && styles.buttonDisabled, pressed && hasPrev && styles.buttonPressed]}
      >
        <Ionicons name="chevron-back" size={18} color={hasPrev ? tokens.colors.primary : tokens.colors.textMuted} />
      </Pressable>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          <Text style={styles.pageNumber}>{currentPage + 1}</Text>
          <Text style={styles.pageSeparator}> / </Text>
          <Text style={styles.pageTotal}>{totalPages}</Text>
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Página siguiente"
        onPress={onNext}
        disabled={!hasNext}
        style={({ pressed }) => [styles.button, !hasNext && styles.buttonDisabled, pressed && hasNext && styles.buttonPressed]}
      >
        <Ionicons name="chevron-forward" size={18} color={hasNext ? tokens.colors.primary : tokens.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    backgroundColor: tokens.colors.primarySoft,
    borderColor: tokens.colors.primary,
  },
  pageInfo: {
    minWidth: 64,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
  },
  pageNumber: {
    fontWeight: '700',
    color: tokens.colors.primary,
    fontSize: 14,
  },
  pageSeparator: {
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
  pageTotal: {
    fontWeight: '400',
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
});
