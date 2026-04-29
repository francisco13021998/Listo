import { supabase } from '../lib/supabase';
import { CreateProductInput, Product, UpdateProductInput } from '../domain/product';
import { logError, logInfo } from '../lib/logger';

export async function listProducts(householdId: string): Promise<Product[]> {
  try {
    logInfo('listProducts', { householdId });

    const { data, error } = await supabase
      .from('products')
      .select('id, household_id, name, brand, quantity, unit, category, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Product[] | null) ?? [];
  } catch (error) {
    logError(error, 'listProducts');
    throw error;
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  try {
    const { householdId, name, brand = null, quantity = null, unit = null, category = null } = input;
    logInfo('createProduct', { householdId, name, brand, quantity, unit, category });

    const { data, error } = await supabase
      .from('products')
      .insert({
        household_id: householdId,
        name,
        brand,
        quantity,
        unit,
        category,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  } catch (error) {
    logError(error, 'createProduct');
    throw error;
  }
}

export async function updateProduct(input: UpdateProductInput): Promise<void> {
  try {
    const { id, name, brand = null, quantity = null, unit = null, category = null } = input;
    logInfo('updateProduct', { id, name, brand, quantity, unit, category });

    const { error } = await supabase
      .from('products')
      .update({
        name,
        brand,
        quantity,
        unit,
        category,
      })
      .eq('id', id);

    if (error) throw error;

    const { error: shoppingListError } = await supabase
      .from('shopping_list_items')
      .update({ text: name })
      .eq('product_id', id);

    if (shoppingListError) throw shoppingListError;
  } catch (error) {
    logError(error, 'updateProduct');
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    logInfo('deleteProduct', { id });

    const { error } = await supabase.rpc('delete_product_and_convert_list_items', {
      p_product_id: id,
    });

    if (error) throw error;
  } catch (error) {
    logError(error, 'deleteProduct');
    throw error;
  }
}
