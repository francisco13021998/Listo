import * as Haptics from 'expo-haptics';

async function runHaptic(action: () => Promise<void>) {
  try {
    await action();
  } catch {
    // No-op: some devices or simulators may not support haptics.
  }
}

export function hapticTap() {
  return runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticSuccess() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticMedium() {
  return runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticDelete() {
  return hapticMedium();
}

export function hapticError() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}