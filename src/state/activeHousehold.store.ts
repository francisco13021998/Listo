import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ActiveHouseholdContextValue = {
  activeHouseholdId: string | null;
  isHydrated: boolean;
  setActiveHouseholdId: (id: string | null) => Promise<void>;
};

const ActiveHouseholdContext = createContext<ActiveHouseholdContextValue | null>(null);

const STORAGE_KEY = 'listo.activeHouseholdId';

export function ActiveHouseholdProvider({ children }: { children: React.ReactNode }) {
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setActiveHouseholdIdState(stored);
      } finally {
        setIsHydrated(true);
      }
    };

    void load();
  }, []);

  const setActiveHouseholdId = async (id: string | null) => {
    setActiveHouseholdIdState(id);

    if (id) {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
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
