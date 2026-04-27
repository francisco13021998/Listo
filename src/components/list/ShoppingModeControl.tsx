import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '../../domain/store';
import { getFloatingMenuStyle } from '../../lib/floatingMenu';
import { tokens } from '../../theme/tokens';

type ShoppingModeControlProps = {
  stores: Store[];
  enabled: boolean;
  selectedStoreId: string | null;
  onToggleEnabled: () => void;
  onSelectStore: (storeId: string) => void;
};

export function ShoppingModeControl({ stores, enabled, selectedStoreId, onToggleEnabled, onSelectStore }: ShoppingModeControlProps) {
  const triggerRef = useRef<View>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  if (stores.length === 0) {
    return null;
  }

  const sortedStores = [...stores].sort((left, right) => left.name.localeCompare(right.name));
  const selectedStoreName = sortedStores.find((store) => store.id === selectedStoreId)?.name ?? null;

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownAnchor({ x, y, width, height });
      setDropdownOpen(true);
    });
  };

  const closeDropdown = () => setDropdownOpen(false);
  const dropdownHeight = Math.min(280, sortedStores.length * 44 + 8);
  const dropdownStyle = getFloatingMenuStyle(dropdownAnchor, { menuWidth: dropdownAnchor.width, menuHeight: dropdownHeight });

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onPress={onToggleEnabled}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.textBlock}>
          <Text style={styles.title}>Estoy comprando</Text>
          <Text style={styles.subtitle}>Activa esto para usar una tienda como referencia rápida.</Text>
        </View>

        <View style={[styles.switchTrack, enabled ? styles.switchTrackOn : styles.switchTrackOff]}>
          <View style={[styles.switchThumb, enabled && styles.switchThumbOn]} />
        </View>
      </Pressable>

      {enabled ? (
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorLabel}>Tienda activa</Text>

          <View ref={triggerRef} collapsable={false}>
            <Pressable onPress={openDropdown} style={({ pressed }) => [styles.selectorButton, pressed && styles.selectorButtonPressed]}>
              <View style={styles.selectorButtonTextBlock}>
                <Text style={[styles.selectorButtonText, !selectedStoreName && styles.selectorButtonPlaceholder]} numberOfLines={1}>
                  {selectedStoreName ?? 'Selecciona una tienda'}
                </Text>
                <Text style={styles.selectorButtonHint}>Se preseleccionará en altas desde la lista.</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={tokens.colors.textMuted} />
            </Pressable>
          </View>

          <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={closeDropdown} statusBarTranslucent>
            <Pressable style={styles.backdrop} onPress={closeDropdown}>
              <View
                style={[
                  styles.dropdown,
                  {
                    top: dropdownStyle.top,
                    left: dropdownStyle.left,
                    width: dropdownAnchor.width,
                  },
                ]}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  contentContainerStyle={styles.dropdownContent}
                >
                  {sortedStores.map((store) => {
                    const active = store.id === selectedStoreId;

                    return (
                      <Pressable
                        key={store.id}
                        accessibilityRole="button"
                        onPress={() => {
                          onSelectStore(store.id);
                          closeDropdown();
                        }}
                        style={({ pressed }) => [styles.dropdownItem, active && styles.dropdownItemActive, pressed && styles.dropdownItemPressed]}
                      >
                        <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{store.name}</Text>
                        {active ? <Ionicons name="checkmark" size={16} color={tokens.colors.primaryDark} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE8DF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowPressed: {
    opacity: 0.96,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 14,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 999,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#1F8A46',
  },
  switchTrackOff: {
    backgroundColor: '#D1D5DB',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  selectorBlock: {
    gap: 6,
  },
  selectorLabel: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  selectorButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E2D6',
    backgroundColor: '#F8FBF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectorButtonPressed: {
    opacity: 0.95,
  },
  selectorButtonTextBlock: {
    flex: 1,
    gap: 1,
  },
  selectorButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  selectorButtonPlaceholder: {
    color: '#98A2B3',
  },
  selectorButtonHint: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
  dropdown: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingVertical: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dropdownContent: {
    paddingVertical: 2,
  },
  dropdownItem: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownItemPressed: {
    backgroundColor: '#F4F7F5',
  },
  dropdownItemActive: {
    backgroundColor: '#EAF4ED',
  },
  dropdownItemText: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: tokens.colors.primaryDark,
  },
});