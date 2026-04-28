import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthLayout } from '../../src/components/AuthLayout';
import { hapticTap } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { tokens } from '../../src/theme/tokens';

const demoLoginTrigger = 'francisco13021998';
const demoLoginEmail = 'francisco13021998@gmail.com';
const demoLoginPassword = '123456';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmationAlertShownRef = useRef(false);

  useEffect(() => {
    const handleDeepLink = (url?: string | null) => {
      if (!url || confirmationAlertShownRef.current) {
        return;
      }

      const parsed = Linking.parse(url);
      if (String(parsed.queryParams?.confirmed) !== 'true') {
        return;
      }

      confirmationAlertShownRef.current = true;
      Alert.alert('Cuenta confirmada', 'Tu usuario ha sido confirmado correctamente');
    };

    void Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleEmailChange = (nextEmail: string) => {
    if (__DEV__ && nextEmail === demoLoginTrigger) {
      setEmail(demoLoginEmail);
      setPassword(demoLoginPassword);
      return;
    }

    setEmail(nextEmail);
  };

  const handleSignIn = async () => {
    try {
      void hapticTap();
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(gate)');
    } catch (err) {
      Alert.alert('Error al iniciar sesión', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Accede a tu cuenta"
      title="Compra mejor. Gasta menos."
      subtitle="Entra en LISTO para gestionar listas, hogares y precios con una experiencia pensada para una tienda moderna."
      cardTitle="Iniciar sesión"
      cardSubtitle="Retoma tu organización y sigue comprando con más control desde el primer toque."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            Crear una
          </Link>
        </View>
      }
    >
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <View style={styles.inputShell}>
          <Ionicons name="mail-outline" size={18} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={handleEmailChange}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Contraseña</Text>
        <View style={styles.inputShell}>
          <Ionicons name="lock-closed-outline" size={18} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Tu contraseña"
            placeholderTextColor="#94A3B8"
            autoComplete="current-password"
            textContentType="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={() => void handleSignIn()}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleSignIn()}
        disabled={loading}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, loading && styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
        {!loading ? <Ionicons name="arrow-forward" size={18} color={tokens.colors.surface} /> : null}
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: 'rgba(15, 23, 42, 0.72)',
    fontSize: 13,
  },
  footerLink: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D6E5D8',
    borderRadius: 16,
    backgroundColor: '#F8FBF8',
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: tokens.colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: tokens.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  primaryButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
