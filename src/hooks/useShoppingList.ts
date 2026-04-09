import { useCallback, useEffect, useState } from 'react';
import { ShoppingListItem } from '../domain/shoppingList';
import {
  addProductItem,
  addTextItem,
  deleteItem,
  listItems,
  toggleItem,
} from '../services/shoppingList.service';

const noop = () => {
  // no-op
};

export function useShoppingList(householdId: string | null) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
  } as const;
}
