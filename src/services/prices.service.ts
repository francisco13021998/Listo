import { PriceEntry, PriceInsight } from '../domain/prices';
import { supabase } from '../lib/supabase';

type AddPriceParams = {
  householdId: string;
  productId: string;
  storeId: string;
  priceCents: number;
  currency?: string;
  purchasedAt?: string;
};

export async function addPrice(params: AddPriceParams): Promise<void> {
  const { householdId, productId, storeId, priceCents, currency, purchasedAt } = params;

  const { error } = await supabase.from('price_entries').insert({
    household_id: householdId,
    product_id: productId,
    store_id: storeId,
    price_cents: priceCents,
    currency: currency ?? null,
    purchased_at: purchasedAt ?? new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function listPriceHistory(householdId: string, productId: string): Promise<PriceEntry[]> {
  const { data, error } = await supabase
    .from('price_entries')
    .select('*')
    .eq('household_id', householdId)
    .eq('product_id', productId)
    .order('purchased_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PriceEntry[]) ?? [];
}

export async function getPriceInsightsForHousehold(
  householdId: string
): Promise<Record<string, PriceInsight>> {
  const { data, error } = await supabase
    .from('price_entries')
    .select('*')
    .eq('household_id', householdId)
    .order('purchased_at', { ascending: false });

  if (error) throw new Error(error.message);

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

    if (
      !bucket.cheapest ||
      entry.price_cents < bucket.cheapest.price_cents ||
      (entry.price_cents === bucket.cheapest.price_cents && entry.purchased_at > bucket.cheapest.purchased_at)
    ) {
      bucket.cheapest = entry;
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
}

export async function getLatestPricesForHousehold(
  householdId: string
): Promise<Record<string, PriceEntry>> {
  const insights = await getPriceInsightsForHousehold(householdId);
  const map: Record<string, PriceEntry> = {};

  for (const [productId, insight] of Object.entries(insights)) {
    if (insight.latest) {
      map[productId] = insight.latest;
    }
  }

  return map;
}

export async function deletePricesForStoreAndProduct(params: {
  householdId: string;
  storeId: string;
  productId: string;
}): Promise<void> {
  const { householdId, storeId, productId } = params;
  const { error } = await supabase
    .from('price_entries')
    .delete()
    .eq('household_id', householdId)
    .eq('store_id', storeId)
    .eq('product_id', productId);

  if (error) throw new Error(error.message);
}

export async function listPriceHistoryForProductFiltered(params: {
  householdId: string;
  productId: string;
  storeId?: string;
}): Promise<PriceEntry[]> {
  const { householdId, productId, storeId } = params;
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
  if (error) throw new Error(error.message);
  return (data as PriceEntry[]) ?? [];
}

export async function listPricesForStoreGroupedByProduct(params: {
  householdId: string;
  storeId: string;
}): Promise<{ product_id: string; product_name: string; prices: PriceEntry[] }[]> {
  const { householdId, storeId } = params;
  const { data, error } = await supabase
    .from('price_entries')
    .select('*, products ( name )')
    .eq('household_id', householdId)
    .eq('store_id', storeId)
    .order('purchased_at', { ascending: false });

  if (error) throw new Error(error.message);

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
}

export async function deleteSinglePriceEntry(priceEntryId: string): Promise<void> {
  const { error } = await supabase
    .from('price_entries')
    .delete()
    .eq('id', priceEntryId);

  if (error) throw new Error(error.message);
}

export async function deleteAllPricesForStore(params: { householdId: string; storeId: string }): Promise<void> {
  const { householdId, storeId } = params;
  const { error } = await supabase
    .from('price_entries')
    .delete()
    .eq('household_id', householdId)
    .eq('store_id', storeId);

  if (error) throw new Error(error.message);
}
