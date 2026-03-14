
-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  usage_type text,
  payment_method text,
  plan text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- RLS for profiles
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id);

create policy "Admins can select all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles
create policy "Users can read own role" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create policy "Admins can select all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles" on public.user_roles
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles" on public.user_roles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
