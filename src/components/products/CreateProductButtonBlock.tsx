import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

type CreateProductButtonBlockProps = {
  onPress: () => void;
};

export function CreateProductButtonBlock({ onPress }: CreateProductButtonBlockProps) {
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonLead}>＋</Text>
        <View style={styles.textBlock}>
          <Text style={styles.buttonTitle}>Nuevo producto</Text>
          <Text style={styles.buttonSubtitle}>Añádelo a tu catálogo.</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 10,
  },
  button: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E8DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  buttonPressed: {
    opacity: 0.94,
  },
  buttonLead: {
    color: tokens.colors.primaryDark,
    fontSize: 19,
    lineHeight: 19,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  buttonTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonSubtitle: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 15,
  },
});