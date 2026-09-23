-- ==========================================================
-- MI RED SOCIAL PERSONAL — SUPABASE
-- Ejecuta TODO este archivo en Supabase > SQL Editor.
-- ==========================================================

create extension if not exists pgcrypto;

-- -------------------------
-- PERFIL
-- -------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Mi nombre',
  username text not null default 'yo',
  bio text not null default '',
  avatar_path text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------
-- PUBLICACIONES
-- -------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  media_path text,
  media_type text,
  created_at timestamptz not null default now()
);

create index if not exists posts_user_created_idx
  on public.posts(user_id, created_at desc);

-- -------------------------
-- RLS DE TABLAS
-- Solo el usuario dueño de la fila puede verla/modificarla.
-- -------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "profile_owner_select" on public.profiles;
create policy "profile_owner_select"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profile_owner_insert" on public.profiles;
create policy "profile_owner_insert"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profile_owner_update" on public.profiles;
create policy "profile_owner_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profile_owner_delete" on public.profiles;
create policy "profile_owner_delete"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "post_owner_select" on public.posts;
create policy "post_owner_select"
on public.posts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "post_owner_insert" on public.posts;
create policy "post_owner_insert"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "post_owner_update" on public.posts;
create policy "post_owner_update"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "post_owner_delete" on public.posts;
create policy "post_owner_delete"
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);

-- -------------------------
-- STORAGE
-- Bucket privado para fotos, GIFs, avatar y portada.
-- -------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Los archivos se guardan así:
-- USER_UUID/avatar/archivo.png
-- USER_UUID/cover/archivo.jpg
-- USER_UUID/posts/archivo.gif

drop policy if exists "media_owner_select" on storage.objects;
create policy "media_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "media_owner_insert" on storage.objects;
create policy "media_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
)
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

-- -------------------------
-- TRIGGER PARA updated_at
-- -------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ==========================================================
-- IMPORTANTE:
-- Después de crear TU cuenta:
-- Supabase Dashboard > Authentication > Settings
-- desactiva "Allow new users / Sign ups" para que nadie más
-- pueda crear una cuenta.
-- ==========================================================
