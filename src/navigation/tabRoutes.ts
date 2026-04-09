export const TAB_ROUTES = [
  { name: 'household', path: '/(tabs)/household' },
  { name: 'list', path: '/(tabs)/list' },
  { name: 'stores', path: '/(tabs)/stores' },
  { name: 'products', path: '/(tabs)/products' },
  { name: 'settings', path: '/(tabs)/settings' },
] as const;

export type TabRouteName = (typeof TAB_ROUTES)[number]['path'];