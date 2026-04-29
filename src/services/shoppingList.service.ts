import { ShoppingListItem } from '../domain/shoppingList';
import { supabase } from '../lib/supabase';
import { logError, logInfo } from '../lib/logger';

export async function listItems(householdId: string): Promise<ShoppingListItem[]> {
  try {
    logInfo('listItems', { householdId });

    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ShoppingListItem[]) ?? [];
  } catch (error) {
    logError(error, 'listItems');
    throw error;
  }
}

export async function addTextItem(householdId: string, text: string): Promise<void> {
  try {
    logInfo('addTextItem', { householdId, text });

    const { error } = await supabase
      .from('shopping_list_items')
      .insert({ household_id: householdId, text, product_id: null });

    if (error) throw error;
  } catch (error) {
    logError(error, 'addTextItem');
    throw error;
  }
}

export async function updateTextItem(itemId: string, text: string): Promise<void> {
  try {
    logInfo('updateTextItem', { itemId, text });

    const { error } = await supabase
      .from('shopping_list_items')
      .update({ text })
      .eq('id', itemId)
      .is('product_id', null);

    if (error) throw error;
  } catch (error) {
    logError(error, 'updateTextItem');
    throw error;
  }
}

export async function addProductItem(
  householdId: string,
  productId: string,
  fallbackText: string
): Promise<void> {
  try {
    logInfo('addProductItem', { householdId, productId, fallbackText });

    const { error } = await supabase
      .from('shopping_list_items')
      .insert({ household_id: householdId, product_id: productId, text: fallbackText });

    if (error) throw error;
  } catch (error) {
    logError(error, 'addProductItem');
    throw error;
  }
}

export async function toggleItem(id: string, isChecked: boolean): Promise<void> {
  try {
    logInfo('toggleItem', { id, isChecked });

    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: isChecked })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, 'toggleItem');
    throw error;
  }
}

export async function markPendingItemsAsBought(householdId: string): Promise<void> {
  try {
    logInfo('markPendingItemsAsBought', { householdId });

    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: true })
      .eq('household_id', householdId)
      .eq('is_checked', false);

    if (error) throw error;
  } catch (error) {
    logError(error, 'markPendingItemsAsBought');
    throw error;
  }
}

export async function clearBoughtItems(householdId: string): Promise<void> {
  try {
    logInfo('clearBoughtItems', { householdId });

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('household_id', householdId)
      .eq('is_checked', true);

    if (error) throw error;
  } catch (error) {
    logError(error, 'clearBoughtItems');
    throw error;
  }
}

export async function attachProductToItem(params: {
  itemId: string;
  productId: string;
  text: string;
  markAsChecked?: boolean;
}): Promise<void> {
  try {
    const { itemId, productId, text, markAsChecked = true } = params;
    logInfo('attachProductToItem', { itemId, productId, text, markAsChecked });

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

    if (error) throw error;
  } catch (error) {
    logError(error, 'attachProductToItem');
    throw error;
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    logInfo('deleteItem', { id });

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, 'deleteItem');
    throw error;
  }
}
