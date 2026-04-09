import { StyleSheet, Text, TextInput, View } from 'react-native';
import { tokens } from '../theme/tokens';

interface AppInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
  label?: string;
}

export function AppInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
  label,
}: AppInputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.text,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.text,
    fontSize: tokens.typography.body.fontSize,
  },
  multiline: {
    minHeight: 96,
  },
});