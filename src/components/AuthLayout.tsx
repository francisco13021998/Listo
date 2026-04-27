import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardSubtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, subtitle, cardTitle, cardSubtitle, footer, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <View pointerEvents="none" style={[styles.statusBarSpacer, { height: insets.top }]} />
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundGlowLarge} />
      <View style={styles.backgroundGlowSmall} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.brandPill}>
              <Ionicons name="cart-outline" size={14} color={tokens.colors.surface} />
              <Text style={styles.brandText}>LISTO</Text>
            </View>

            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{cardTitle}</Text>
              <Text style={styles.cardSubtitle}>{cardSubtitle}</Text>
            </View>

            <View style={styles.form}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF7EE',
  },
  statusBarSpacer: {
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
    justifyContent: 'flex-start',
  },
  backgroundTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: '#176B3A',
  },
  backgroundGlowLarge: {
    position: 'absolute',
    top: 36,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
  },
  backgroundGlowSmall: {
    position: 'absolute',
    left: -70,
    bottom: 110,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 107, 58, 0.10)',
  },
  hero: {
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xs,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  brandText: {
    color: tokens.colors.surface,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  eyebrow: {
    color: 'rgba(236, 253, 245, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: tokens.colors.surface,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    maxWidth: 340,
  },
  subtitle: {
    color: 'rgba(236, 253, 245, 0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 560,
  },
  card: {
    marginTop: tokens.spacing.xl,
    backgroundColor: tokens.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
    shadowColor: '#0F5132',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardHeader: {
    gap: 6,
  },
  cardTitle: {
    color: tokens.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    paddingTop: tokens.spacing.md,
    gap: 4,
  },
});