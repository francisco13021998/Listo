import { Ionicons } from '@expo/vector-icons';
import { tokens } from './tokens';
import { DEFAULT_PRODUCT_CATEGORY, PRODUCT_CATEGORY_VISUALS, normalizeProductCategory } from '../domain/productCategories';

export type VisualBadge = {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  color: string;
};

export function getHouseholdVisual(): VisualBadge {
  return {
    icon: 'home-outline',
    backgroundColor: tokens.colors.primarySoft,
    color: tokens.colors.primaryDark,
  };
}

export function getStoreVisual(): VisualBadge {
  return {
    icon: 'storefront-outline',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  };
}

export function getPendingVisual(hasPending: boolean): VisualBadge {
  return hasPending
    ? {
        icon: 'cart-outline',
        backgroundColor: '#FFF7ED',
        color: '#C2410C',
      }
    : {
        icon: 'checkmark-circle-outline',
        backgroundColor: tokens.colors.primarySoft,
        color: tokens.colors.primaryDark,
      };
}

export function getCategoryVisual(category: string | null | undefined): VisualBadge {
  const normalizedCategory = normalizeProductCategory(category);
  const badge = PRODUCT_CATEGORY_VISUALS[normalizedCategory] ?? PRODUCT_CATEGORY_VISUALS[DEFAULT_PRODUCT_CATEGORY];

  return badge;
}