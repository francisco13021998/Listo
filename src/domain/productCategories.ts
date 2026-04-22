import { Ionicons } from '@expo/vector-icons';

export const DEFAULT_PRODUCT_CATEGORY = 'Sin categoría' as const;

export type ProductCategoryValue =
  | typeof DEFAULT_PRODUCT_CATEGORY
  | 'Fruta y verdura'
  | 'Carne, pescado y charcutería'
  | 'Lácteos y refrigerados'
  | 'Despensa'
  | 'Congelados'
  | 'Bebidas'
  | 'Higiene y hogar'
  | 'Otros';

export type SelectableProductCategory = Exclude<ProductCategoryValue, typeof DEFAULT_PRODUCT_CATEGORY>;

export type ProductCategoryOption = {
  label: SelectableProductCategory;
  value: SelectableProductCategory;
};

export const PRODUCT_CATEGORY_OPTIONS: ProductCategoryOption[] = [
  { label: 'Fruta y verdura', value: 'Fruta y verdura' },
  { label: 'Carne, pescado y charcutería', value: 'Carne, pescado y charcutería' },
  { label: 'Lácteos y refrigerados', value: 'Lácteos y refrigerados' },
  { label: 'Despensa', value: 'Despensa' },
  { label: 'Congelados', value: 'Congelados' },
  { label: 'Bebidas', value: 'Bebidas' },
  { label: 'Higiene y hogar', value: 'Higiene y hogar' },
  { label: 'Otros', value: 'Otros' },
];

export type ProductCategoryVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  color: string;
};

export const PRODUCT_CATEGORY_VISUALS: Record<ProductCategoryValue, ProductCategoryVisual> = {
  'Sin categoría': { icon: 'help-circle-outline', backgroundColor: '#E5E7EB', color: '#4B5563' },
  'Fruta y verdura': { icon: 'leaf-outline', backgroundColor: '#DCFCE7', color: '#15803D' },
  'Carne, pescado y charcutería': { icon: 'restaurant-outline', backgroundColor: '#FEE2E2', color: '#B91C1C' },
  'Lácteos y refrigerados': { icon: 'snow-outline', backgroundColor: '#E0F2FE', color: '#0369A1' },
  Despensa: { icon: 'archive-outline', backgroundColor: '#F3F4F6', color: '#4B5563' },
  Congelados: { icon: 'snow-outline', backgroundColor: '#DBEAFE', color: '#2563EB' },
  Bebidas: { icon: 'wine-outline', backgroundColor: '#FAE8FF', color: '#A21CAF' },
  'Higiene y hogar': { icon: 'sparkles-outline', backgroundColor: '#EDE9FE', color: '#7C3AED' },
  Otros: { icon: 'grid-outline', backgroundColor: '#E5E7EB', color: '#374151' },
};

export function normalizeProductCategory(category: string | null | undefined): ProductCategoryValue {
  const normalized = category?.trim();
  if (!normalized) {
    return DEFAULT_PRODUCT_CATEGORY;
  }

  if (normalized in PRODUCT_CATEGORY_VISUALS) {
    return normalized as ProductCategoryValue;
  }

  return DEFAULT_PRODUCT_CATEGORY;
}
