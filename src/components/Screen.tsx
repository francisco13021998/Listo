import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  scrollable?: boolean;
  includeBottomSafeArea?: boolean;
}

export function Screen({ children, scrollable, includeBottomSafeArea = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={includeBottomSafeArea ? ["bottom", "left", "right"] : ["left", "right"]}>
      <View pointerEvents="none" style={[styles.statusBarSpacer, { height: insets.top }]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled
        keyboardVerticalOffset={0}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.container}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  statusBarSpacer: {
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
});