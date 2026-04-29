import { Store } from '../domain/store';
import { supabase } from '../lib/supabase';
import { logError, logInfo } from '../lib/logger';

export async function listStores(householdId: string): Promise<Store[]> {
  try {
    logInfo('listStores', { householdId });

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Store[]) ?? [];
  } catch (error) {
    logError(error, 'listStores');
    throw error;
  }
}

export async function createStore(householdId: string, name: string): Promise<Store> {
  try {
    logInfo('createStore', { householdId, name });

    const { data, error } = await supabase
      .from('stores')
      .insert({ household_id: householdId, name })
      .select()
      .single();

    if (error) throw error;
    return data as Store;
  } catch (error) {
    logError(error, 'createStore');
    throw error;
  }
}

export async function updateStore(id: string, name: string): Promise<void> {
  try {
    logInfo('updateStore', { id, name });

    const { error } = await supabase
      .from('stores')
      .update({ name })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, 'updateStore');
    throw error;
  }
}

export async function deleteStore(id: string): Promise<void> {
  try {
    logInfo('deleteStore', { id });

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, 'deleteStore');
    throw error;
  }
}

export async function hasPrices(storeId: string): Promise<boolean> {
  try {
    logInfo('hasPrices', { storeId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('id')
      .eq('store_id', storeId)
      .limit(1);

    if (error) throw error;
    return (data ?? []).length > 0;
  } catch (error) {
    logError(error, 'hasPrices');
    throw error;
  }
}

export async function listStorePricedProducts(
  householdId: string,
  storeId: string
): Promise<{ product_id: string; product_name: string }[]> {
  try {
    logInfo('listStorePricedProducts', { householdId, storeId });

    const { data, error } = await supabase
      .from('price_entries')
      .select('product_id, products ( name )')
      .eq('household_id', householdId)
      .eq('store_id', storeId);

    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      const pid = row.product_id as string;
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      const pname = (product as { name: string } | null)?.name ?? 'Producto';
      if (!map[pid]) map[pid] = pname;
    }

    return Object.entries(map).map(([product_id, product_name]) => ({ product_id, product_name }));
  } catch (error) {
    logError(error, 'listStorePricedProducts');
    throw error;
  }
}
