import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type SearchSuggestion = {
  id: string;
  name: string;
  latestPrice: number | null;
  latestStoreName: string | null;
  comparisonLabel: string | null;
  isCheapestMatch: boolean;
};

type AddItemBlockProps = {
  query: string;
  loading?: boolean;
  isSubmitting?: boolean;
  inputRef: React.RefObject<TextInput | null>;
  suggestions: SearchSuggestion[];
  dropdownVisible: boolean;
  dropdownOpacity: Animated.Value;
  dropdownTranslateY: Animated.Value;
  onChangeQuery: (value: string) => void;
  onSubmitText: () => void;
  onSelectSuggestion: (productId: string, name: string) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onSuggestionPressIn: () => void;
  formatPrice: (cents: number) => string;
};

export function AddItemBlock({
  query,
  loading,
  isSubmitting,
  inputRef,
  suggestions,
  dropdownVisible,
  dropdownOpacity,
  dropdownTranslateY,
  onChangeQuery,
  onSubmitText,
  onSelectSuggestion,
  onInputFocus,
  onInputBlur,
  onSuggestionPressIn,
  formatPrice,
}: AddItemBlockProps) {
  const trimmedQuery = query.trim();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Añadir producto</Text>
          <Text style={styles.subtitle}>Busca o escribe.</Text>
        </View>
      </View>

      <View style={styles.inputShell}>
        <Ionicons name="search-outline" size={18} color="#667085" />
        <TextInput
          ref={inputRef}
          placeholder="Buscar o escribir"
          placeholderTextColor="#98A2B3"
          value={query}
          onChangeText={onChangeQuery}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onSubmitText}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          blurOnSubmit={false}
        />

        <Pressable
          accessibilityRole="button"
          onPress={onSubmitText}
          disabled={loading || isSubmitting || !trimmedQuery}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            (loading || isSubmitting || !trimmedQuery) && styles.addButtonDisabled,
          ]}
        >
          <Text style={styles.addButtonText}>{isSubmitting ? 'Añadiendo...' : 'Añadir'}</Text>
        </Pressable>
      </View>

      {dropdownVisible ? (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: dropdownOpacity,
              transform: [{ translateY: dropdownTranslateY }],
            },
          ]}
        >
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownHeaderTitle}>Sugerencias</Text>
            <Text style={styles.dropdownHeaderMeta}>{suggestions.length} resultados</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPressIn={onSuggestionPressIn}
            onPress={onSubmitText}
            disabled={isSubmitting || !trimmedQuery}
            style={({ pressed }) => [styles.dropdownItemPrimary, pressed && styles.dropdownItemPressed]}
          >
            <Text style={styles.dropdownPrimaryLabel}>Añadir "{trimmedQuery}"</Text>
          </Pressable>

          {suggestions.map((product) => (
            <Pressable
              key={product.id}
              accessibilityRole="button"
              onPressIn={onSuggestionPressIn}
              onPress={() => onSelectSuggestion(product.id, product.name)}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
            >
              <View style={styles.dropdownItemTopRow}>
                <Text style={styles.dropdownItemTitle}>{product.name}</Text>
                {product.latestPrice !== null || product.comparisonLabel || product.latestStoreName ? (
                  <Text style={styles.dropdownItemInlineMeta} numberOfLines={1}>
                    {[
                      product.latestPrice !== null ? formatPrice(product.latestPrice) : null,
                      product.comparisonLabel,
                      product.latestStoreName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7EDE8',
    zIndex: 12,
  },
  header: {
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  inputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E2D6',
    backgroundColor: '#FFFFFF',
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    minHeight: 36,
    borderRadius: 11,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addButtonPressed: {
    opacity: 0.92,
  },
  addButtonDisabled: {
    opacity: 0.55,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dropdown: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingVertical: 8,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dropdownHeaderTitle: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownHeaderMeta: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownItemPrimary: {
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: '#EEF7F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  dropdownPrimaryLabel: {
    color: tokens.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemPressed: {
    opacity: 0.92,
    backgroundColor: '#F8FBF8',
  },
  dropdownItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    minWidth: 0,
  },
  dropdownItemInlineMeta: {
    flexShrink: 1,
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
});