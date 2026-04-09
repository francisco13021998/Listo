export type ProductUnit = 'g' | 'kg' | 'ml' | 'l' | 'u';

export interface Product {
  id: string;
  household_id: string;
  name: string;
  brand: string | null;
  quantity: number | null;
  unit: ProductUnit | null;
  category: string | null;
  created_at: string;
}

export type ProductInput = {
  name: string;
  brand?: string | null;
  quantity?: number | null;
  unit?: ProductUnit | null;
  category?: string | null;
};

export type CreateProductInput = ProductInput & {
  householdId: string;
};

export type UpdateProductInput = ProductInput & {
  id: string;
};
