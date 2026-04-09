export type ShoppingListItem = {
  id: string;
  household_id: string;
  product_id: string | null;
  text: string;
  quantity: number | null;
  is_checked: boolean;
  created_at: string;
};
