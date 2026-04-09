import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed] }>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  pressed: {
    opacity: 0.85,
  },
  texts: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#4a4a4a',
  },
});
