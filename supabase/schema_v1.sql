-- LISTO schema v1 for Supabase (Postgres + RLS + RPC)
-- Paste into Supabase SQL editor.

-- Extensions
create extension if not exists pgcrypto;

-- Helper function: check membership
create or replace function public.is_household_member(hid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.household_members hm
    where hm.household_id = hid
      and hm.user_id = auth.uid()
  );
end;
$$;

-- Tables
-- profiles: one-to-one with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  created_at timestamptz default now()
);

alter table if exists public.profiles
  add column if not exists username text;

create unique index if not exists idx_profiles_username on public.profiles (username) where username is not null;

update public.profiles p
set username = nullif(
  trim(
    coalesce(
      p.username,
      p.display_name,
      split_part(au.email, '@', 1)
    )
  ),
  ''
)
from auth.users au
where au.id = p.id
  and (p.username is null or trim(p.username) = '');

-- households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz default now()
);

-- household members
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  primary key (household_id, user_id)
);

-- household invitations
create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- price entries
create table if not exists public.price_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  price_cents int not null,
  quantity numeric,
  unit text,
  currency text default 'EUR',
  purchased_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- shopping list items
create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  text text not null,
  quantity numeric,
  is_checked boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_products_household on public.products (household_id);
create index if not exists idx_stores_household on public.stores (household_id);
create index if not exists idx_price_entries_household_product on public.price_entries (household_id, product_id);
create index if not exists idx_shopping_list_items_household on public.shopping_list_items (household_id);
create index if not exists idx_household_invitations_household on public.household_invitations (household_id);
create index if not exists idx_household_invitations_expires_at on public.household_invitations (expires_at);

-- Trigger: auto profile on auth.users insert
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_username boolean;
  has_display_name boolean;
  has_created_at boolean;
  columns text[] := array['id'];
  values_sql text := quote_literal(new.id::text);
  insert_sql text;
  username_value text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  display_name_value text := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username')), '');
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'username'
  ) into has_username;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) into has_display_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at'
  ) into has_created_at;

  if has_username then
    columns := array_append(columns, 'username');
    values_sql := values_sql || ', ' || quote_nullable(username_value);
  end if;

  if has_display_name then
    columns := array_append(columns, 'display_name');
    values_sql := values_sql || ', ' || quote_nullable(display_name_value);
  end if;

  if has_created_at then
    columns := array_append(columns, 'created_at');
    values_sql := values_sql || ', now()';
  end if;

  insert_sql := format(
    'insert into public.profiles (%s) values (%s) on conflict (id) do nothing',
    array_to_string(columns, ', '),
    values_sql
  );

  execute insert_sql;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.price_entries enable row level security;
alter table public.shopping_list_items enable row level security;

-- RLS Policies
-- profiles: user can manage only their own row
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_household_member_select on public.profiles;
create policy profiles_household_member_select on public.profiles
  for select using (
    exists (
      select 1
      from public.household_members me
      join public.household_members them
        on them.household_id = me.household_id
      where me.user_id = auth.uid()
        and them.user_id = profiles.id
    )
  );
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (auth.uid() = id);

-- Optional: allow users to look up their own username data safely via auth-owned rows.

-- households: select if member; insert authenticated; update/delete only owner
drop policy if exists households_select_member on public.households;
create policy households_select_member on public.households
  for select using (exists (select 1 from public.household_members hm where hm.household_id = id and hm.user_id = auth.uid()));
drop policy if exists households_insert_auth on public.households;
create policy households_insert_auth on public.households
  for insert with check (auth.uid() is not null);
drop policy if exists households_update_owner on public.households;
create policy households_update_owner on public.households
  for update using (created_by = auth.uid());
drop policy if exists households_delete_owner on public.households;
create policy households_delete_owner on public.households
  for delete using (created_by = auth.uid());

-- household_members: select if member; insert self; delete owner
drop policy if exists household_members_select_member on public.household_members;
create policy household_members_select_member on public.household_members
  for select using (public.is_household_member(household_id));
drop policy if exists household_members_insert_self on public.household_members;
create policy household_members_insert_self on public.household_members
  for insert with check (auth.uid() = user_id);
drop policy if exists household_members_delete_owner on public.household_members;
create policy household_members_delete_owner on public.household_members
  for delete using (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.created_by = auth.uid()
    )
  );

-- household_invitations: select if member of the household
drop policy if exists household_invitations_select_member on public.household_invitations;
create policy household_invitations_select_member on public.household_invitations
  for select using (public.is_household_member(household_id));

-- products RLS
drop policy if exists products_select_member on public.products;
create policy products_select_member on public.products
  for select using (public.is_household_member(household_id));
drop policy if exists products_modify_member on public.products;
create policy products_modify_member on public.products
  for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- stores RLS
drop policy if exists stores_select_member on public.stores;
create policy stores_select_member on public.stores
  for select using (public.is_household_member(household_id));
drop policy if exists stores_modify_member on public.stores;
create policy stores_modify_member on public.stores
  for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- price_entries RLS
drop policy if exists price_entries_select_member on public.price_entries;
create policy price_entries_select_member on public.price_entries
  for select using (public.is_household_member(household_id));
drop policy if exists price_entries_modify_member on public.price_entries;
create policy price_entries_modify_member on public.price_entries
  for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- shopping_list_items RLS
drop policy if exists shopping_list_items_select_member on public.shopping_list_items;
create policy shopping_list_items_select_member on public.shopping_list_items
  for select using (public.is_household_member(household_id));
drop policy if exists shopping_list_items_modify_member on public.shopping_list_items;
create policy shopping_list_items_modify_member on public.shopping_list_items
  for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_list_items'
  ) then
    execute 'alter publication supabase_realtime add table public.shopping_list_items';
  end if;
end $$;

-- RPC: create_household
create or replace function public.create_household(p_name text, init_stores text[] default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hid uuid;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  insert into public.households (name, created_by)
  values (p_name, v_uid)
  returning id into v_hid;

  insert into public.household_members (household_id, user_id, role)
  values (v_hid, v_uid, 'owner')
  on conflict do nothing;

  if init_stores is not null then
    insert into public.stores (household_id, name)
    select v_hid, unnest(init_stores);
  end if;

  return v_hid;
end;
$$;

-- RPC: join_household
create or replace function public.join_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  -- ensure household exists
  perform 1 from public.households h where h.id = p_household_id;
  if not found then
    raise exception 'Household % not found', p_household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (p_household_id, v_uid, 'member')
  on conflict do nothing;
end;
$$;

-- RPC: create_household_invitation
create or replace function public.create_household_invitation(p_household_id uuid)
returns table(code text, expires_at timestamptz, household_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    begin
      insert into public.household_invitations (household_id, code, created_by, expires_at)
      values (p_household_id, v_code, v_uid, now() + interval '5 minutes');

      code := v_code;
      expires_at := now() + interval '5 minutes';
      household_id := p_household_id;
      return next;
      return;
    exception
      when unique_violation then
        null;
    end;
  end loop;
end;
$$;

-- RPC: join_household_by_code
create or replace function public.join_household_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(trim(p_code), '[^A-Z0-9]', '', 'g'));
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  select hi.household_id
    into v_household_id
  from public.household_invitations hi
  where upper(regexp_replace(hi.code, '[^A-Z0-9]', '', 'g')) = v_code
    and hi.expires_at > now()
  order by hi.created_at desc
  limit 1;

  if v_household_id is null then
    raise exception 'Código inválido o expirado';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.household_id = v_household_id
      and hm.user_id = v_uid
  ) then
    raise exception 'Ya perteneces a este hogar';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'member')
  on conflict do nothing;

  return v_household_id;
end;
$$;

-- RPC: leave_household_or_delete
create or replace function public.leave_household_or_delete(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member_count int;
  v_is_owner boolean;
  v_new_owner uuid;
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  if not exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = v_uid
  ) then
    raise exception 'No perteneces a este hogar';
  end if;

  select count(*)::int
    into v_member_count
  from public.household_members hm
  where hm.household_id = p_household_id;

  select (h.created_by = v_uid)
    into v_is_owner
  from public.households h
  where h.id = p_household_id;

  if v_member_count <= 1 then
    delete from public.households
    where id = p_household_id;

    return 'deleted';
  end if;

  if v_is_owner then
    select hm.user_id
      into v_new_owner
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id <> v_uid
    order by hm.created_at asc, hm.user_id asc
    limit 1;

    if v_new_owner is not null then
      update public.households
      set created_by = v_new_owner
      where id = p_household_id;
    end if;
  end if;

  delete from public.household_members
  where household_id = p_household_id
    and user_id = v_uid;

  return 'left';
end;
$$;

-- RPC: get household members with profile names
create or replace function public.get_household_members(p_household_id uuid)
returns table(user_id uuid, display_name text, role text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    hm.user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Miembro') as display_name,
    hm.role,
    hm.created_at
  from public.household_members hm
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = p_household_id
  order by hm.created_at asc, hm.user_id asc;
$$;

-- RPC: rename household
create or replace function public.rename_household(p_household_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'auth.uid() is null';
  end if;

  update public.households
  set name = trim(p_name)
  where id = p_household_id
    and created_by = v_uid;

  if not found then
    raise exception 'No se pudo cambiar el nombre del hogar';
  end if;
end;
$$;

-- RPC: get household members with the best available name
create or replace function public.get_household_members(p_household_id uuid)
returns table(user_id uuid, username text, role text, created_at timestamptz)
language sql
security definer
set search_path = public, auth
as $$
  select
    hm.user_id,
    coalesce(
      nullif(trim(p.username), ''),
      nullif(split_part(au.email, '@', 1), ''),
      'Miembro'
    ) as username,
    hm.role,
    hm.created_at
  from public.household_members hm
  left join public.profiles p on p.id = hm.user_id
  left join auth.users au on au.id = hm.user_id
  where hm.household_id = p_household_id
  order by hm.created_at asc, hm.user_id asc;
$$;

-- PASOS EN SUPABASE
-- 1) Pegar y ejecutar este SQL en el editor de Supabase.
-- 2) Activar el proveedor de auth por email/password si no está activo.
-- 3) (Opcional) Crear usuarios de prueba para desarrollo.
