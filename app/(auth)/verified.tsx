import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../src/theme/tokens';

export default function VerifiedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <View pointerEvents="none" style={[styles.statusBarSpacer, { height: insets.top }]} />
      <View style={styles.backgroundTop} />

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons name="checkmark-circle" size={64} color={tokens.colors.primary} />
          </View>

          <Text style={styles.title}>¡Correo verificado!</Text>
          <Text style={styles.subtitle}>
            Tu cuenta y dirección de correo han sido confirmadas correctamente. Ya puedes iniciar sesión.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.replace('/(auth)/sign-in')}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EAF7EE',
  },
  statusBarSpacer: {
    backgroundColor: '#000000',
  },
  backgroundTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: '#176B3A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: tokens.spacing.sm,
  },
  button: {
    width: '100%',
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
