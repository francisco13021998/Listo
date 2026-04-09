-- Iteración 4C: elimina un producto y libera items de la lista asociada
create or replace function public.delete_product_and_convert_list_items(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hid uuid;
begin
  -- 1) obtener el hogar del producto
  select household_id into v_hid from public.products where id = p_product_id;
  if v_hid is null then
    raise exception 'product not found';
  end if;

  -- 2) verificar membresía en el hogar
  if not public.is_household_member(v_hid) then
    raise exception 'not allowed';
  end if;

  -- 3) convertir ítems ligados al producto a texto libre
  update public.shopping_list_items
    set product_id = null
    where product_id = p_product_id;

  -- 4) borrar el producto
  delete from public.products where id = p_product_id;
end;
$$;

grant execute on function public.delete_product_and_convert_list_items(uuid) to authenticated;
