import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function ProductsHeader() {
  return (
    <View style={styles.heroHeader}>
      <View style={styles.pageHeader}>
        <Text style={styles.heroEyebrow}>LISTO</Text>
        <Text style={styles.pageTitle}>Productos</Text>
        <Text style={styles.pageSubtitle}>Consulta precios y detalles de producto.</Text>
      </View>

      <View style={styles.heroOrbPrimary} />
      <View style={styles.heroOrbSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 42,
  },
  pageHeader: {
    gap: 4,
    zIndex: 2,
    maxWidth: 560,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  pageSubtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    flexShrink: 1,
  },
  heroOrbPrimary: {
    position: 'absolute',
    right: -30,
    top: -28,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroOrbSecondary: {
    position: 'absolute',
    right: 36,
    bottom: -28,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});