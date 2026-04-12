import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Household } from '../../domain/household';
import { tokens } from '../../theme/tokens';
import { getHouseholdVisual } from '../../theme/visuals';

type HouseholdSelectionCardProps = {
  household: Household;
  onPress: () => void;
  onMenuPress?: () => void;
  onAccess?: () => void;
  onLeave?: () => void;
  menuOpen?: boolean;
  disabled?: boolean;
};

export function HouseholdSelectionCard({ household, onPress, onMenuPress, onAccess, onLeave, menuOpen, disabled }: HouseholdSelectionCardProps) {
  const visual = getHouseholdVisual();

  return (
    <View style={styles.cardShell}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={`Entrar en ${household.name}`}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, disabled && styles.cardDisabled]}
      >
        <View style={[styles.iconWrap, { backgroundColor: visual.backgroundColor }]}> 
          <Ionicons name={visual.icon} size={20} color={visual.color} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>{household.name}</Text>
          <Text style={styles.subtitle}>Toca para entrar en este hogar</Text>
        </View>

        <View style={styles.actionBlock}>
          {onMenuPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Opciones de ${household.name}`}
              accessibilityHint="Abre el menú de acciones del hogar"
              disabled={disabled}
              onPress={(event) => {
                event.stopPropagation();
                onMenuPress?.();
              }}
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed, disabled && styles.cardDisabled]}
            >
              <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {menuOpen ? (
        <View style={styles.dropdown}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Acceder a ${household.name}`}
            onPress={() => {
              onAccess?.();
            }}
            style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
          >
            <Ionicons name="enter-outline" size={16} color={tokens.colors.primaryDark} />
            <Text style={styles.dropdownItemText}>Acceder</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Salir de ${household.name}`}
            onPress={() => {
              onLeave?.();
            }}
            style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
          >
            <Ionicons name="exit-outline" size={16} color="#B42318" />
            <Text style={[styles.dropdownItemText, styles.dropdownItemDanger]}>Salir</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    gap: 8,
    position: 'relative',
  },
  card: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.97,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  actionBlock: {
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    opacity: 0.9,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 10,
    zIndex: 10,
    minWidth: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  dropdownItem: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemPressed: {
    backgroundColor: '#F3F6F2',
  },
  dropdownItemText: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownItemDanger: {
    color: '#B42318',
  },
});