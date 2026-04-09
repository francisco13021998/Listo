import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function PrimaryButton({ title, onPress, disabled, loading, fullWidth }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, fullWidth && styles.fullWidth, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <Text style={styles.label}>{loading ? 'Cargando...' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: tokens.colors.surface,
    fontSize: tokens.typography.button.fontSize,
    fontWeight: tokens.typography.button.fontWeight,
  },
});
