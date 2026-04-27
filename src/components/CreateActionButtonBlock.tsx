import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

type CreateActionButtonBlockProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBackgroundColor: string;
  iconColor: string;
  onPress: () => void;
};

export function CreateActionButtonBlock({
  title,
  subtitle,
  icon,
  iconBackgroundColor,
  iconColor,
  onPress,
}: CreateActionButtonBlockProps) {
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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