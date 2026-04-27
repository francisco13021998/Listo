import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UseShoppingStorePreferenceParams = {
  userId: string | null;
  householdId: string | null;
  availableStoreIds: string[];
};

function getStorageKey(userId: string | null, householdId: string | null) {
  if (!userId || !householdId) {
    return null;
  }

  return `listo.shoppingStore:${userId}:${householdId}`;
}

function getEnabledStorageKey(userId: string | null, householdId: string | null) {
  if (!userId || !householdId) {
    return null;
  }

  return `listo.shoppingModeEnabled:${userId}:${householdId}`;
}

export function useShoppingStorePreference({ userId, householdId, availableStoreIds }: UseShoppingStorePreferenceParams) {
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(null);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const storageKey = useMemo(() => getStorageKey(userId, householdId), [householdId, userId]);
  const enabledStorageKey = useMemo(() => getEnabledStorageKey(userId, householdId), [householdId, userId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!storageKey || !enabledStorageKey) {
        setSelectedStoreIdState(null);
        setIsEnabledState(false);
        setIsHydrated(true);
        return;
      }

      try {
        const [storedStoreId, storedEnabled] = await Promise.all([
          AsyncStorage.getItem(storageKey),
          AsyncStorage.getItem(enabledStorageKey),
        ]);

        if (cancelled) {
          return;
        }

        setSelectedStoreIdState(storedStoreId);
        setIsEnabledState(storedEnabled === null ? Boolean(storedStoreId) : storedEnabled === 'true');
      } catch {
        if (!cancelled) {
          setSelectedStoreIdState(null);
          setIsEnabledState(false);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    setIsHydrated(false);
    void load();

    return () => {
      cancelled = true;
    };
  }, [enabledStorageKey, storageKey]);

  useEffect(() => {
    if (!isHydrated || !selectedStoreId || availableStoreIds.length === 0 || availableStoreIds.includes(selectedStoreId)) {
      return;
    }

    setSelectedStoreIdState(null);
    setIsEnabledState(false);

    if (storageKey) {
      void AsyncStorage.removeItem(storageKey);
    }

    if (enabledStorageKey) {
      void AsyncStorage.setItem(enabledStorageKey, 'false');
    }
  }, [availableStoreIds, enabledStorageKey, isHydrated, selectedStoreId, storageKey]);

  useEffect(() => {
    if (!isHydrated || !enabledStorageKey) {
      return;
    }

    void (async () => {
      try {
        await AsyncStorage.setItem(enabledStorageKey, String(isEnabled));
      } catch {
        // Ignoramos el error de persistencia para no bloquear la UX.
      }
    })();
  }, [enabledStorageKey, isEnabled, isHydrated]);

  const setSelectedStoreId = useCallback(
    (nextStoreId: string | null) => {
      setSelectedStoreIdState(nextStoreId);

      if (nextStoreId) {
        setIsEnabledState(true);
      }

      if (!storageKey) {
        return;
      }

      void (async () => {
        try {
          if (nextStoreId) {
            await AsyncStorage.setItem(storageKey, nextStoreId);
          } else {
            await AsyncStorage.removeItem(storageKey);
          }
        } catch {
          // Ignoramos el error de persistencia para no bloquear la UX.
        }
      })();
    },
    [storageKey]
  );

  const setIsEnabled = useCallback((nextEnabled: boolean) => {
    setIsEnabledState(nextEnabled);
  }, []);

  return {
    selectedStoreId,
    setSelectedStoreId,
    isEnabled,
    setIsEnabled,
  } as const;
}