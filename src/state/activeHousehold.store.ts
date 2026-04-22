import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type ActiveHouseholdContextValue = {
  activeHouseholdId: string | null;
  isHydrated: boolean;
  setActiveHouseholdId: (id: string | null) => Promise<void>;
};

const ActiveHouseholdContext = createContext<ActiveHouseholdContextValue | null>(null);

const STORAGE_KEY_PREFIX = 'listo.activeHouseholdId';

function getStorageKey(userId: string | null) {
  return `${STORAGE_KEY_PREFIX}:${userId ?? 'anonymous'}`;
}

export function ActiveHouseholdProvider({ children }: { children: React.ReactNode }) {
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageKey, setStorageKey] = useState(() => getStorageKey(null));

  useEffect(() => {
    let cancelled = false;

    const loadForUser = async (key: string) => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!cancelled) {
          setActiveHouseholdIdState(stored);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }

      const nextStorageKey = getStorageKey(data.session?.user?.id ?? null);
      setStorageKey(nextStorageKey);
      await loadForUser(nextStorageKey);
    };

    void bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextStorageKey = getStorageKey(nextSession?.user?.id ?? null);
      setStorageKey(nextStorageKey);
      setActiveHouseholdIdState(null);
      setIsHydrated(false);

      void (async () => {
        const stored = await AsyncStorage.getItem(nextStorageKey);
        if (!cancelled) {
          setActiveHouseholdIdState(stored);
          setIsHydrated(true);
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const setActiveHouseholdId = async (id: string | null) => {
    setActiveHouseholdIdState(id);

    if (id) {
      await AsyncStorage.setItem(storageKey, id);
    } else {
      await AsyncStorage.removeItem(storageKey);
    }
  };

  const value = useMemo(
    () => ({ activeHouseholdId, isHydrated, setActiveHouseholdId }),
    [activeHouseholdId, isHydrated, setActiveHouseholdId]
  );

  return React.createElement(ActiveHouseholdContext.Provider, { value }, children);
}

export function useActiveHouseholdStore() {
  const ctx = useContext(ActiveHouseholdContext);
  if (!ctx) {
    throw new Error('useActiveHouseholdStore debe usarse dentro de ActiveHouseholdProvider');
  }
  return ctx;
}
