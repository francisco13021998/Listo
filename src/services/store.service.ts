import { Store } from '../domain/store';
import { supabase } from '../lib/supabase';

export async function listStores(householdId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Store[]) ?? [];
}

export async function createStore(householdId: string, name: string): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .insert({ household_id: householdId, name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Store;
}

export async function updateStore(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ name })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteStore(id: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function hasPrices(storeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('price_entries')
    .select('id')
    .eq('store_id', storeId)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function listStorePricedProducts(
  householdId: string,
  storeId: string
): Promise<{ product_id: string; product_name: string }[]> {
  const { data, error } = await supabase
    .from('price_entries')
    .select('product_id, products ( name )')
    .eq('household_id', householdId)
    .eq('store_id', storeId);

  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const pid = row.product_id as string;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const pname = (product as { name: string } | null)?.name ?? 'Producto';
    if (!map[pid]) map[pid] = pname;
  }

  return Object.entries(map).map(([product_id, product_name]) => ({ product_id, product_name }));
}
