import { useCallback, useLayoutEffect, useState } from 'react';
import { Store } from '../domain/store';
import { createStore, deleteStore, listStores, updateStore } from '../services/store.service';

const noop = () => {
  // no-op
};

export function useStores(householdId: string | null) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(() => Boolean(householdId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setStores([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listStores(householdId);
      setStores(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  const create = useCallback(
    async (name: string) => {
      if (!householdId) throw new Error('No hay hogar activo');

      const store = await createStore(householdId, name);
      await refresh();
      return store;
    },
    [householdId, refresh]
  );

  const update = useCallback(
    async (id: string, name: string) => {
      await updateStore(id, name);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteStore(id);
      await refresh();
    },
    [refresh]
  );

  useLayoutEffect(() => {
    void refresh();
  }, [refresh]);

  if (!householdId) {
    return {
      stores: [],
      loading: false,
      error: null,
      refresh: noop,
      createStore: (_name: string) => Promise.reject(new Error('No hay hogar activo')),
      updateStore: (_id: string, _name: string) => Promise.reject(new Error('No hay hogar activo')),
      deleteStore: (_id: string) => Promise.reject(new Error('No hay hogar activo')),
    } as const;
  }

  return {
    stores,
    loading,
    error,
    refresh,
    createStore: create,
    updateStore: update,
    deleteStore: remove,
  } as const;
}