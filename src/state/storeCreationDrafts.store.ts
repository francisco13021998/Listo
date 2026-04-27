import { ProductUnit } from '../domain/product';
import { ProductCategoryValue } from '../domain/productCategories';

export type ProductEditorDraft = {
  name: string;
  brand: string;
  quantity: string;
  unit: ProductUnit | '';
  category: ProductCategoryValue | '';
  includeInitialPrice: boolean;
  initialPriceStoreId: string | null;
  initialPrice: string;
  shoppingModeActive: boolean;
  markAsBought: boolean;
  sourceShoppingItemId: string | null;
  sourceShoppingItemChecked: boolean;
  finalReturnTo?: string | null;
};

export type PriceEditorDraft = {
  selectedStoreId: string | null;
  priceText: string;
  quantityText: string;
  selectedUnit: ProductUnit | '';
  shoppingModeActive: boolean;
  markAsBought: boolean;
  sourceShoppingItemId: string | null;
  sourceShoppingItemChecked: boolean;
};

let productEditorDraft: ProductEditorDraft | null = null;
let priceEditorDraft: PriceEditorDraft | null = null;

export function saveProductEditorDraft(draft: ProductEditorDraft) {
  productEditorDraft = draft;
}

export function peekProductEditorDraft() {
  return productEditorDraft;
}

export function clearProductEditorDraft() {
  productEditorDraft = null;
}

export function consumeProductEditorDraft() {
  const draft = productEditorDraft;
  productEditorDraft = null;
  return draft;
}

export function savePriceEditorDraft(draft: PriceEditorDraft) {
  priceEditorDraft = draft;
}

export function consumePriceEditorDraft() {
  const draft = priceEditorDraft;
  priceEditorDraft = null;
  return draft;
}