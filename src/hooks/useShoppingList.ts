import { useCallback, useEffect, useState } from 'react';
import { ShoppingListItem } from '../domain/shoppingList';
import { supabase } from '../lib/supabase';
import {
  addProductItem,
  addTextItem,
  clearBoughtItems,
  deleteItem,
  listItems,
  toggleItem,
} from '../services/shoppingList.service';

const noop = () => {
  // no-op
};

type ShoppingListChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ShoppingListItem | null;
  old: ShoppingListItem | null;
};

export function useShoppingList(householdId: string | null) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(() => Boolean(householdId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listItems(householdId);
      setItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  const applyRealtimeChange = useCallback((payload: ShoppingListChangePayload) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setItems((current) => {
        if (current.some((item) => item.id === payload.new?.id)) {
          return current.map((item) => (item.id === payload.new?.id ? payload.new! : item));
        }

        return [...current, payload.new!].sort((left, right) => {
          if (left.created_at === right.created_at) {
            return left.id.localeCompare(right.id);
          }

          return left.created_at.localeCompare(right.created_at);
        });
      });
      return;
    }

    if (payload.eventType === 'UPDATE' && payload.new) {
      setItems((current) => current.map((item) => (item.id === payload.new?.id ? payload.new! : item)));
      return;
    }

    if (payload.eventType === 'DELETE' && payload.old) {
      setItems((current) => current.filter((item) => item.id !== payload.old?.id));
    }
  }, []);

  const addText = useCallback(
    async (text: string) => {
      if (!householdId) throw new Error('No hay hogar activo');
      await addTextItem(householdId, text);
      await refresh();
    },
    [householdId, refresh]
  );

  const addProduct = useCallback(
    async (productId: string, fallbackText: string) => {
      if (!householdId) throw new Error('No hay hogar activo');
      await addProductItem(householdId, productId, fallbackText);
      await refresh();
    },
    [householdId, refresh]
  );

  const toggle = useCallback(
    async (id: string, isChecked: boolean) => {
      await toggleItem(id, isChecked);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteItem(id);
      await refresh();
    },
    [refresh]
  );

  const clearBought = useCallback(
    async () => {
      if (!householdId) throw new Error('No hay hogar activo');
      await clearBoughtItems(householdId);
      await refresh();
    },
    [householdId, refresh]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!householdId) {
      return;
    }

    const channel = supabase
      .channel(`shopping-list-items:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          applyRealtimeChange(payload as unknown as ShoppingListChangePayload);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyRealtimeChange, householdId]);

  if (!householdId) {
    return {
      items: [],
      loading: false,
      error: null,
      refresh: noop,
      addTextItem: (_text: string) => Promise.reject(new Error('No hay hogar activo')),
      addProductItem: (_productId: string, _fallbackText: string) =>
        Promise.reject(new Error('No hay hogar activo')),
      toggleItem: (_id: string, _isChecked: boolean) => Promise.reject(new Error('No hay hogar activo')),
      deleteItem: (_id: string) => Promise.reject(new Error('No hay hogar activo')),
      clearBoughtItems: () => Promise.reject(new Error('No hay hogar activo')),
    } as const;
  }

  return {
    items,
    loading,
    error,
    refresh,
    addTextItem: addText,
    addProductItem: addProduct,
    toggleItem: toggle,
    deleteItem: remove,
    clearBoughtItems: clearBought,
  } as const;
}
