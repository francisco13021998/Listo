import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ProductsSearchBlockProps = {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
};

export function ProductsSearchBlock({ value, onChangeText, onClear }: ProductsSearchBlockProps) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar en tu catálogo</Text>
        <Text style={styles.subtitle}>Encuentra un producto por su nombre en un momento.</Text>
      </View>

      <View style={styles.searchField}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Buscar producto por nombre"
          placeholderTextColor="#98A2B3"
          value={value}
          onChangeText={onChangeText}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {hasValue ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={onClear} style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 9,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  header: {
    gap: 2,
  },
  title: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
  },
  searchField: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIcon: {
    color: '#667085',
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#EEF4EF',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPressed: {
    opacity: 0.92,
  },
  clearButtonText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '700',
  },
});