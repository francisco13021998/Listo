import { ShoppingListItem } from '../domain/shoppingList';
import { supabase } from '../lib/supabase';

export async function listItems(householdId: string): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ShoppingListItem[]) ?? [];
}

export async function addTextItem(householdId: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ household_id: householdId, text, product_id: null });

  if (error) throw new Error(error.message);
}

export async function updateTextItem(itemId: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ text })
    .eq('id', itemId)
    .is('product_id', null);

  if (error) throw new Error(error.message);
}

export async function addProductItem(
  householdId: string,
  productId: string,
  fallbackText: string
): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ household_id: householdId, product_id: productId, text: fallbackText });

  if (error) throw new Error(error.message);
}

export async function toggleItem(id: string, isChecked: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: isChecked })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markPendingItemsAsBought(householdId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: true })
    .eq('household_id', householdId)
    .eq('is_checked', false);

  if (error) throw new Error(error.message);
}

export async function clearBoughtItems(householdId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('household_id', householdId)
    .eq('is_checked', true);

  if (error) throw new Error(error.message);
}

export async function attachProductToItem(params: {
  itemId: string;
  productId: string;
  text: string;
  markAsChecked?: boolean;
}): Promise<void> {
  const { itemId, productId, text, markAsChecked = true } = params;
  const updatePayload: { product_id: string; text: string; is_checked?: boolean } = {
    product_id: productId,
    text,
  };

  if (markAsChecked) {
    updatePayload.is_checked = true;
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .update(updatePayload)
    .eq('id', itemId);

  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
