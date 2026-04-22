import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthLayout } from '../../src/components/AuthLayout';
import { hapticTap } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { tokens } from '../../src/theme/tokens';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const isUsernameConflictError = (message: string) => {
    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage.includes('duplicate key') ||
      normalizedMessage.includes('idx_profiles_username') ||
      normalizedMessage.includes('profiles_username')
    );
  };

  const handleSignUp = async () => {
    try {
      void hapticTap();
      setLoading(true);
      const trimmedUsername = username.trim().toLowerCase();

      if (!trimmedUsername) {
        Alert.alert('Nombre de usuario requerido', 'Escribe un nombre de usuario para continuar.');
        return;
      }

      const usernamePattern = /^[a-z0-9._-]{3,24}$/;
      if (!usernamePattern.test(trimmedUsername)) {
        Alert.alert(
          'Nombre de usuario no válido',
          'Usa entre 3 y 24 caracteres: letras minúsculas, números, punto, guion o guion bajo.'
        );
        return;
      }

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: trimmedUsername, display_name: trimmedUsername },
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        await supabase
          .from('profiles')
          .upsert({ id: data.session.user.id, username: trimmedUsername, display_name: trimmedUsername });
      }

      if (data.session) {
        router.replace('/(gate)');
        return;
      }

      Alert.alert('Cuenta creada', 'Revisa tu correo para confirmar tu cuenta.', [
        {
          text: 'Aceptar',
          onPress: () => router.replace('/(auth)/sign-in'),
        },
      ]);
    } catch (err) {
      const message = (err as Error).message;
      if (isUsernameConflictError(message)) {
        Alert.alert('Nombre de usuario en uso', 'Ese nombre de usuario ya existe. Elige otro para continuar.');
        return;
      }

      Alert.alert('Error al registrar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Abre tu cuenta"
      title="Empieza a ahorrar en cada compra."
      subtitle="Crea tu acceso para organizar hogares, listas y tiendas con una interfaz más clara, más verde y más comercial."
      cardTitle="Crear cuenta"
      cardSubtitle="Tardarás un minuto en empezar a usar una app pensada para compras del día a día."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/sign-in" style={styles.footerLink}>
            Inicia sesión
          </Link>
        </View>
      }
    >
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nombre de usuario</Text>
        <View style={styles.inputShell}>
          <Ionicons name="person-outline" size={18} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Tu usuario"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
          />
        </View>
      </View>

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
            onChangeText={setEmail}
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
            placeholder="Crea una contraseña"
            placeholderTextColor="#94A3B8"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={() => void handleSignUp()}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleSignUp()}
        disabled={loading}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, loading && styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>{loading ? 'Creando…' : 'Crear cuenta'}</Text>
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
