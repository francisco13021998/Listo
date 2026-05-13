import { PriceEntry, PriceInsight } from '../domain/prices';
import { ProductUnit } from '../domain/product';
import { supabase } from '../lib/supabase';
import { logError, logInfo } from '../lib/logger';

/**
 * Normaliza la cantidad a una unidad de referencia para comparar precios por unidad.
 * Reglas:
 *   g  → kg  (÷1000)
 *   ml → L   (÷1000) [tratado igual que kg para comparación cross-familia]
 *   kg, l, u → se usan tal cual (1 u = 1 kg/L)
 */
function getUnitPriceCents(priceCents: number, quantity: number | null, unit: ProductUnit | null): number | null {
  if (!quantity || quantity <= 0 || !unit) return null;
  const normalizedQty = unit === 'g' || unit === 'ml' ? quantity / 1000 : quantity;
  return priceCents / normalizedQty;
}

type AddPriceParams = {
  householdId: string;
  productId: string;
  storeId: string;
  priceCents: number;
  quantity?: number | null;
  unit?: ProductUnit | null;
  currency?: string;
  purchasedAt?: string;
};

export async function addPrice(params: AddPriceParams): Promise<void> {
  try {
    const { householdId, productId, storeId, priceCents, quantity, unit, currency, purchasedAt } = params;
    logInfo('addPrice', { householdId, productId, storeId, priceCents, quantity, unit, currency, purchasedAt });

    const { data: existingEntries, error: lookupError } = await supabase
      .from('price_entries')
      .select('id')
      .eq('household_id', householdId)
      .eq('product_id', productId)
      .eq('store_id', storeId)
      .order('purchased_at', { ascending: false });

    if (lookupError) throw lookupError;

    const matchedEntries = (existingEntries ?? []) as Array<{ id: string }>;
    const [primaryEntry, ...duplicateEntries] = matchedEntries;

    if (primaryEntry) {
      const { error: updateError } = await supabase
        .from('price_entries')
        .update({
          price_cents: priceCents,
          quantity: quantity ?? null,
          unit: unit ?? null,
          currency: currency ?? null,
          purchased_at: purchasedAt ?? new Date().toISOString(),
        })
        .eq('id', primaryEntry.id)
        .eq('household_id', householdId);

      if (updateError) throw updateError;

      if (duplicateEntries.length > 0) {
        const duplicateIds = duplicateEntries.map((entry) => entry.id);
        const { error: deleteError } = await supabase.from('price_entries').delete().in('id', duplicateIds);

        if (deleteError) throw deleteError;
      }

      return;
    }

    const { error } = await supabase.from('price_entries').insert({
      household_id: householdId,
      product_id: productId,
      store_id: storeId,
      price_cents: priceCents,
      quantity: quantity ?? null,
      unit: unit ?? null,
      currency: currency ?? null,
      purchased_at: purchasedAt ?? new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    logError(error, 'addPrice');
    throw error;
  }
}

export async function getPriceEntryById(params: {
  householdId: string;
  priceEntryId: string;
}): Promise<PriceEntry | null> {
  try {
    const { householdId, priceEntryId } = params;
    logInfo('getPriceEntryById', { householdId, priceEntryId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('*')
      .eq('household_id', householdId)
      .eq('id', priceEntryId)
      .maybeSingle();

    if (error) throw error;
    return (data as PriceEntry | null) ?? null;
  } catch (error) {
    logError(error, 'getPriceEntryById');
    throw error;
  }
}

export async function updatePriceEntry(params: {
  householdId: string;
  priceEntryId: string;
  storeId: string;
  priceCents: number;
  quantity?: number | null;
  unit?: ProductUnit | null;
  currency?: string;
}): Promise<void> {
  try {
    const { householdId, priceEntryId, storeId, priceCents, quantity, unit, currency } = params;
    logInfo('updatePriceEntry', { householdId, priceEntryId, storeId, priceCents, quantity, unit, currency });

    const { error } = await supabase
      .from('price_entries')
      .update({
        store_id: storeId,
        price_cents: priceCents,
        quantity: quantity ?? null,
        unit: unit ?? null,
        currency: currency ?? null,
      })
      .eq('household_id', householdId)
      .eq('id', priceEntryId);

    if (error) throw error;
  } catch (error) {
    logError(error, 'updatePriceEntry');
    throw error;
  }
}

export async function listPriceHistory(householdId: string, productId: string): Promise<PriceEntry[]> {
  try {
    logInfo('listPriceHistory', { householdId, productId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('*')
      .eq('household_id', householdId)
      .eq('product_id', productId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return (data as PriceEntry[]) ?? [];
  } catch (error) {
    logError(error, 'listPriceHistory');
    throw error;
  }
}

export async function getPriceInsightsForHousehold(
  householdId: string,
  comparisonMode: 'unit_price' | 'total_price' = 'unit_price'
): Promise<Record<string, PriceInsight>> {
  try {
    logInfo('getPriceInsightsForHousehold', { householdId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('*')
      .eq('household_id', householdId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    const map: Record<
      string,
      {
        latest: PriceEntry | null;
        cheapest: PriceEntry | null;
        storeIds: Set<string>;
      }
    > = {};

    for (const entry of (data as PriceEntry[]) ?? []) {
      if (!map[entry.product_id]) {
        map[entry.product_id] = {
          latest: null,
          cheapest: null,
          storeIds: new Set<string>(),
        };
      }

      const bucket = map[entry.product_id];
      bucket.storeIds.add(entry.store_id);

      if (!bucket.latest) {
        bucket.latest = entry;
      }

      if (!bucket.cheapest) {
        bucket.cheapest = entry;
      } else {
        let isCheaper: boolean;
        if (comparisonMode === 'unit_price') {
          const entryUP = getUnitPriceCents(entry.price_cents, entry.quantity, entry.unit);
          const currentUP = getUnitPriceCents(bucket.cheapest.price_cents, bucket.cheapest.quantity, bucket.cheapest.unit);
          if (entryUP !== null && currentUP !== null) {
            isCheaper = entryUP < currentUP || (entryUP === currentUP && entry.purchased_at > bucket.cheapest.purchased_at);
          } else {
            isCheaper = entry.price_cents < bucket.cheapest.price_cents ||
              (entry.price_cents === bucket.cheapest.price_cents && entry.purchased_at > bucket.cheapest.purchased_at);
          }
        } else {
          isCheaper = entry.price_cents < bucket.cheapest.price_cents ||
            (entry.price_cents === bucket.cheapest.price_cents && entry.purchased_at > bucket.cheapest.purchased_at);
        }
        if (isCheaper) bucket.cheapest = entry;
      }
    }

    const insights: Record<string, PriceInsight> = {};
    for (const [productId, bucket] of Object.entries(map)) {
      insights[productId] = {
        latest: bucket.latest,
        cheapest: bucket.cheapest,
        storeCount: bucket.storeIds.size,
      };
    }

    return insights;
  } catch (error) {
    logError(error, 'getPriceInsightsForHousehold');
    throw error;
  }
}

export async function getLatestPricesForHousehold(
  householdId: string
): Promise<Record<string, PriceEntry>> {
  try {
    logInfo('getLatestPricesForHousehold', { householdId });

    const insights = await getPriceInsightsForHousehold(householdId);
    const map: Record<string, PriceEntry> = {};

    for (const [productId, insight] of Object.entries(insights)) {
      if (insight.latest) {
        map[productId] = insight.latest;
      }
    }

    return map;
  } catch (error) {
    logError(error, 'getLatestPricesForHousehold');
    throw error;
  }
}

export async function deletePricesForStoreAndProduct(params: {
  householdId: string;
  storeId: string;
  productId: string;
}): Promise<void> {
  try {
    const { householdId, storeId, productId } = params;
    logInfo('deletePricesForStoreAndProduct', { householdId, storeId, productId });

    const { error } = await supabase
      .from('price_entries')
      .delete()
      .eq('household_id', householdId)
      .eq('store_id', storeId)
      .eq('product_id', productId);

    if (error) throw error;
  } catch (error) {
    logError(error, 'deletePricesForStoreAndProduct');
    throw error;
  }
}

export async function listPriceHistoryForProductFiltered(params: {
  householdId: string;
  productId: string;
  storeId?: string;
}): Promise<PriceEntry[]> {
  try {
    const { householdId, productId, storeId } = params;
    logInfo('listPriceHistoryForProductFiltered', { householdId, productId, storeId });

    let query = supabase
      .from('price_entries')
      .select('*')
      .eq('household_id', householdId)
      .eq('product_id', productId)
      .order('purchased_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as PriceEntry[]) ?? [];
  } catch (error) {
    logError(error, 'listPriceHistoryForProductFiltered');
    throw error;
  }
}

export async function listPricesForStoreGroupedByProduct(params: {
  householdId: string;
  storeId: string;
}): Promise<{ product_id: string; product_name: string; prices: PriceEntry[] }[]> {
  try {
    const { householdId, storeId } = params;
    logInfo('listPricesForStoreGroupedByProduct', { householdId, storeId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('*, products ( name )')
      .eq('household_id', householdId)
      .eq('store_id', storeId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    const groups: Record<string, { product_id: string; product_name: string; prices: PriceEntry[] }> = {};

    for (const row of (data as (PriceEntry & { products?: { name?: string } | null })[]) ?? []) {
      const pid = row.product_id;
      if (!groups[pid]) {
        groups[pid] = {
          product_id: pid,
          product_name: row.products?.name ?? 'Producto',
          prices: [],
        };
      }
      const { products, ...entry } = row;
      groups[pid].prices.push(entry as PriceEntry);
    }

    return Object.values(groups);
  } catch (error) {
    logError(error, 'listPricesForStoreGroupedByProduct');
    throw error;
  }
}

export async function deleteSinglePriceEntry(priceEntryId: string): Promise<void> {
  try {
    logInfo('deleteSinglePriceEntry', { priceEntryId });

    const { error } = await supabase
      .from('price_entries')
      .delete()
      .eq('id', priceEntryId);

    if (error) throw error;
  } catch (error) {
    logError(error, 'deleteSinglePriceEntry');
    throw error;
  }
}

export async function deleteAllPricesForStore(params: { householdId: string; storeId: string }): Promise<void> {
  try {
    const { householdId, storeId } = params;
    logInfo('deleteAllPricesForStore', { householdId, storeId });

    const { error } = await supabase
      .from('price_entries')
      .delete()
      .eq('household_id', householdId)
      .eq('store_id', storeId);

    if (error) throw error;
  } catch (error) {
    logError(error, 'deleteAllPricesForStore');
    throw error;
  }
}
