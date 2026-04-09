import { Ionicons } from '@expo/vector-icons';
import { tokens } from './tokens';

export type VisualBadge = {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  color: string;
};

const categoryVisuals: Record<string, VisualBadge> = {
  'Fruta y verdura': { icon: 'leaf-outline', backgroundColor: '#E7F6ED', color: tokens.colors.primaryDark },
  'Carnes y charcutería': { icon: 'restaurant-outline', backgroundColor: '#FEE2E2', color: '#B91C1C' },
  'Pescado y marisco': { icon: 'fish-outline', backgroundColor: '#E0F2FE', color: '#0369A1' },
  'Lácteos y huevos': { icon: 'egg-outline', backgroundColor: '#FFF7ED', color: '#C2410C' },
  'Panadería y bollería': { icon: 'pizza-outline', backgroundColor: '#FEF3C7', color: '#B45309' },
  'Despensa y conservas': { icon: 'archive-outline', backgroundColor: '#F3F4F6', color: '#4B5563' },
  Aceites: { icon: 'water-outline', backgroundColor: '#ECFCCB', color: '#4D7C0F' },
  'Salsas y condimentos': { icon: 'flask-outline', backgroundColor: '#FDE68A', color: '#B45309' },
  'Pasta, arroz y legumbres': { icon: 'nutrition-outline', backgroundColor: '#DCFCE7', color: '#15803D' },
  'Aceitunas y encurtidos': { icon: 'ellipse-outline', backgroundColor: '#E0E7FF', color: '#4338CA' },
  Congelados: { icon: 'snow-outline', backgroundColor: '#E0F2FE', color: '#0284C7' },
  Bebidas: { icon: 'wine-outline', backgroundColor: '#FAE8FF', color: '#A21CAF' },
  'Café, té e infusiones': { icon: 'cafe-outline', backgroundColor: '#F4E8D8', color: '#92400E' },
  'Snacks y dulces': { icon: 'ice-cream-outline', backgroundColor: '#FCE7F3', color: '#DB2777' },
  'Aseo personal': { icon: 'sparkles-outline', backgroundColor: '#EDE9FE', color: '#7C3AED' },
  'Limpieza del hogar': { icon: 'sparkles-outline', backgroundColor: '#DCFCE7', color: '#0F766E' },
  'Bebés e infantil': { icon: 'happy-outline', backgroundColor: '#E0F2FE', color: '#0F766E' },
  Mascotas: { icon: 'paw-outline', backgroundColor: '#F3F4F6', color: '#6B7280' },
  'Salud y farmacia': { icon: 'medical-outline', backgroundColor: '#FEE2E2', color: '#B91C1C' },
  otros: { icon: 'grid-outline', backgroundColor: '#E5E7EB', color: '#374151' },
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
  if (!category?.trim()) {
    return {
      icon: 'cube-outline',
      backgroundColor: '#F3F4F6',
      color: '#4B5563',
    };
  }

  return categoryVisuals[category.trim()] ?? {
    icon: 'cube-outline',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  };
}