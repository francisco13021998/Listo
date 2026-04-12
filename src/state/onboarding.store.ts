import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'listo.hasSeenOnboarding';

function getStorageKey(userId: string | null) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function useOnboardingState(userId: string | null) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setHasSeenOnboarding(false);
    setIsHydrated(false);

    const load = async () => {
      if (!userId) {
        if (!cancelled) {
          setIsHydrated(true);
        }
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(getStorageKey(userId));
        if (!cancelled) {
          setHasSeenOnboarding(stored === 'true');
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markOnboardingSeen = async () => {
    if (!userId) {
      return;
    }

    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(getStorageKey(userId), 'true');
  };

  return { isHydrated, hasSeenOnboarding, markOnboardingSeen } as const;
}
