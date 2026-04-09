import { supabase } from '../lib/supabase';
import { CreateProductInput, Product, UpdateProductInput } from '../domain/product';

export async function listProducts(householdId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, household_id, name, brand, quantity, unit, category, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Product[] | null) ?? [];
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { householdId, name, brand = null, quantity = null, unit = null, category = null } = input;

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

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(input: UpdateProductInput): Promise<void> {
  const { id, name, brand = null, quantity = null, unit = null, category = null } = input;

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

  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_product_and_convert_list_items', {
    p_product_id: id,
  });

  if (error) throw new Error(error.message);
}
