import { useCallback, useEffect, useState } from 'react';
import { PriceEntry, PriceInsight } from '../domain/prices';
import { addPrice, getPriceInsightsForHousehold, listPriceHistory } from '../services/prices.service';

const noop = () => {
  // no-op
};

type UsePricesResult = {
  latestByProductId: Record<string, PriceEntry>;
  insightsByProductId: Record<string, PriceInsight>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addPrice: (params: {
    productId: string;
    storeId: string;
    priceCents: number;
    currency?: string;
    purchasedAt?: string;
  }) => Promise<void>;
  getHistory: (productId: string) => Promise<PriceEntry[]>;
};

export function usePrices(householdId: string | null): UsePricesResult {
  const [latestByProductId, setLatestByProductId] = useState<Record<string, PriceEntry>>({});
  const [insightsByProductId, setInsightsByProductId] = useState<Record<string, PriceInsight>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setLatestByProductId({});
      setInsightsByProductId({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const insights = await getPriceInsightsForHousehold(householdId);
      const map: Record<string, PriceEntry> = {};

      for (const [productId, insight] of Object.entries(insights)) {
        if (insight.latest) {
          map[productId] = insight.latest;
        }
      }

      setLatestByProductId(map);
      setInsightsByProductId(insights);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  const add = useCallback(
    async (params: {
      productId: string;
      storeId: string;
      priceCents: number;
      currency?: string;
      purchasedAt?: string;
    }) => {
      if (!householdId) throw new Error('No hay hogar activo');
      await addPrice({ householdId, ...params });
      await refresh();
    },
    [householdId, refresh]
  );

  const getHistory = useCallback(
    async (productId: string) => {
      if (!householdId) throw new Error('No hay hogar activo');
      return listPriceHistory(householdId, productId);
    },
    [householdId]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!householdId) {
    return {
      latestByProductId: {} as Record<string, PriceEntry>,
      insightsByProductId: {} as Record<string, PriceInsight>,
      loading: false,
      error: null,
      refresh: noop,
      addPrice: () => Promise.reject(new Error('No hay hogar activo')),
      getHistory: (_productId: string) => Promise.reject(new Error('No hay hogar activo')),
    } as const;
  }

  return {
    latestByProductId,
    insightsByProductId,
    loading,
    error,
    refresh,
    addPrice: add,
    getHistory,
  } as const;
}
