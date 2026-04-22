-- Repair script for signup failures caused by profiles schema drift.
-- Execute this in the Supabase SQL editor of the active project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  created_at timestamptz default now()
);

alter table if exists public.profiles
  add column if not exists username text;

alter table if exists public.profiles
  add column if not exists display_name text;

alter table if exists public.profiles
  add column if not exists created_at timestamptz default now();

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

create unique index if not exists idx_profiles_username
  on public.profiles (username)
  where username is not null;

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

alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);
