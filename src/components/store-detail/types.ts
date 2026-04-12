export type StoreProductListItem = {
  productId: string;
  productName: string;
  latestPriceId: string;
  priceLabel: string;
  measureLabel: string | null;
  unitPriceLabel: string | null;
  updatedAtLabel: string;
};