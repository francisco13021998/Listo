import { Pressable, StyleSheet, Text } from 'react-native';
import { tokens } from '../theme/tokens';

interface SecondaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function SecondaryButton({ title, onPress, disabled, fullWidth }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, fullWidth && styles.fullWidth, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.successSoft,
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
    color: tokens.colors.text,
    fontSize: tokens.typography.button.fontSize,
    fontWeight: tokens.typography.button.fontWeight,
  },
});