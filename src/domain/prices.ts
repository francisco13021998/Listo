import { ProductUnit } from './product';

export type PriceEntry = {
  id: string;
  household_id: string;
  product_id: string;
  store_id: string;
  price_cents: number;
  quantity: number | null;
  unit: ProductUnit | null;
  currency: string | null;
  purchased_at: string;
  created_by: string | null;
};

export type LatestPriceByProduct = {
  product_id: string;
  price_cents: number;
  store_id: string;
  purchased_at: string;
};

export type PriceInsight = {
  latest: PriceEntry | null;
  cheapest: PriceEntry | null;
  storeCount: number;
};
