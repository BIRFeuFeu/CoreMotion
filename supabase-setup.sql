-- =========================================================
-- COREMOTION — SETUP COMPLETO (schema + hardening)
-- Cole TUDO no SQL Editor do Supabase e clique em Run.
-- Idempotente: pode rodar de novo sem problema.
-- Contém: 0001 (schema) + 0002 (storage) + 0003 (privacidade).
-- =========================================================

-- =========================================================
-- COREMOTION — SCHEMA COMPLETO PARA SUPABASE
-- Copie este arquivo inteiro e cole no SQL Editor do seu
-- projeto Supabase (Menu lateral > SQL Editor > New query)
-- e clique em "Run".
--
-- Este arquivo é seguro para rodar de novo (idempotente) — 
-- se você já rodou uma versão antiga dele, pode rodar este 
-- por cima sem problema, ele só vai atualizar o que mudou.
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. TABELA: profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default 'Novo Atleta',
  contact text,
  role text default 'Atleta',
  title text,
  club text,
  graduation text,
  medals text,
  championships text,
  sports text[] default '{}',
  avatar_url text,
  dark_mode boolean default false,
  marketing_emails boolean default false,
  public_profile boolean default true,
  is_admin boolean default false,
  is_owner boolean default false,
  team_id uuid,
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists title text;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists is_owner boolean default false;
alter table public.profiles add column if not exists team_id uuid;

-- =========================================================
-- 1b. TABELA: teams (página personalizável da equipe)
-- Cada admin gerencia no máximo uma equipe (unique admin_id).
-- =========================================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  sport text,
  tagline text,
  description text,
  location text,
  contact text,
  logo_url text,
  cover_url text,
  primary_color text default '#e5383b',
  created_at timestamptz default now()
);
alter table public.profiles drop constraint if exists profiles_team_id_fkey;
alter table public.profiles add constraint profiles_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

-- =========================================================
-- 1c. TABELA: admin_requests
-- =========================================================
drop table if exists public.admin_invite_codes cascade;
drop function if exists public.redeem_admin_code(text);

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text, email text, team_name text, message text,
  status text default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
drop index if exists admin_requests_one_pending;
create unique index admin_requests_one_pending
  on public.admin_requests(user_id) where status = 'pending';

-- =========================================================
-- 2. TABELA: products (Marketplace)
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade,
  title text not null, description text, price numeric not null,
  category text, image_url text,
  created_at timestamptz default now(),
  constraint products_title_len check (char_length(title) between 5 and 80),
  constraint products_price_valid check (price >= 0 and price <= 999999),
  constraint products_desc_len check (description is null or char_length(description) <= 1000)
);

-- =========================================================
-- 3. TABELA: product_comments
-- =========================================================
create table if not exists public.product_comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  constraint comments_len check (char_length(content) between 2 and 280)
);

-- =========================================================
-- 4. TABELA: news
-- =========================================================
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  title text not null, content text, category text, image_url text,
  created_at timestamptz default now(),
  constraint news_title_len check (char_length(title) between 5 and 120),
  constraint news_content_len check (content is null or char_length(content) <= 5000)
);

-- =========================================================
-- 5. TABELA: media
-- =========================================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  media_type text default 'image', url text not null, caption text,
  created_at timestamptz default now()
);

-- =========================================================
-- 6. TABELA: media_likes
-- =========================================================
create table if not exists public.media_likes (
  media_id uuid references public.media(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (media_id, user_id)
);

-- =========================================================
-- 7. TABELA: events (treinos e campeonatos — Agenda)
-- =========================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text default 'treino',
  sport text, description text, location text,
  event_date timestamptz,
  creator_id uuid references public.profiles(id) on delete set null,
  team_id uuid,
  created_at timestamptz default now(),
  constraint events_title_len check (char_length(title) between 3 and 80),
  constraint events_type_valid check (type in ('treino', 'campeonato')),
  constraint events_desc_len check (description is null or char_length(description) <= 500)
);
alter table public.events add column if not exists creator_id uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists team_id uuid;
alter table public.events drop constraint if exists events_team_id_fkey;
alter table public.events add constraint events_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

-- =========================================================
-- 8. TABELA: event_enrollments
-- =========================================================
create table if not exists public.event_enrollments (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- =========================================================
-- 9. TABELA: cart_items
-- =========================================================
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity int default 1,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- =========================================================
-- TRIGGER: cria automaticamente uma linha em "profiles"
-- para todo novo usuário (inclusive contas convidado/anônimas).
--
-- IMPORTANTE: o e-mail abaixo é reconhecido automaticamente como
-- DONO DO SITE assim que essa pessoa criar a conta (vira admin E
-- dono, de cara, sem precisar de aprovação).
--
-- E-mail do dono configurado: alfeu.paula@escola.pr.gov.br
-- (se precisar trocar, altere aqui E no bloco de "conserto retroativo"
-- mais abaixo, mantendo os dois iguais.)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  owner_email text := 'alfeu.paula@escola.pr.gov.br';
  is_the_owner boolean := (lower(new.email) = lower(owner_email));
  meta_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    'Novo Atleta'
  );
  meta_avatar text := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );
begin
  if lower(owner_email) = 'seu-email-dono@exemplo.com' then
    raise exception 'schema.sql: configure o e-mail do dono em handle_new_user() antes de rodar.';
  end if;
  insert into public.profiles (id, full_name, avatar_url, is_owner, is_admin)
  values (new.id, meta_name, meta_avatar, is_the_owner, is_the_owner)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Conserto retroativo: garante que o dono tenha is_owner=true
do $$
begin
  if lower('alfeu.paula@escola.pr.gov.br') = 'seu-email-dono@exemplo.com' then
    raise notice 'schema.sql: aviso — e-mail do dono ainda é o placeholder. Troque nas DUAS ocorrências e rode de novo.';
    return;
  end if;
  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles p
  set is_owner = true, is_admin = true
  from auth.users u
  where p.id = u.id and lower(u.email) = lower('alfeu.paula@escola.pr.gov.br');
end $$;

-- =========================================================
-- FUNÇÕES AUXILIARES: is_guest, is_admin, is_owner
-- =========================================================
create or replace function public.is_guest()
returns boolean as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$ language sql stable;

create or replace function public.is_admin()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql stable;

create or replace function public.is_owner()
returns boolean as $$
  select coalesce((select is_owner from public.profiles where id = auth.uid()), false);
$$ language sql stable;

-- =========================================================
-- TRIGGER DE PROTEÇÃO: ninguém auto-promove is_admin / is_owner
-- =========================================================
create or replace function public.protect_admin_flag()
returns trigger as $$
begin
  if coalesce(current_setting('app.allow_admin_change', true), '') <> 'true' then
    if NEW.is_admin is distinct from OLD.is_admin then NEW.is_admin := OLD.is_admin; end if;
    if NEW.is_owner is distinct from OLD.is_owner then NEW.is_owner := OLD.is_owner; end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_protect_admin_flag on public.profiles;
create trigger trg_protect_admin_flag
  before update on public.profiles
  for each row execute procedure public.protect_admin_flag();

-- =========================================================
-- RPCs do Painel do Dono + Admin Requests
-- =========================================================
create or replace function public.request_admin_access(p_team_name text, p_message text default null)
returns boolean as $$
begin
  if public.is_guest() then raise exception 'Contas convidado não podem solicitar acesso de administrador.'; end if;
  if public.is_admin() then raise exception 'Esta conta já é administradora.'; end if;

  insert into public.admin_requests (user_id, full_name, email, team_name, message)
  select id, full_name, (select email from auth.users where id = auth.uid()), p_team_name, p_message
  from public.profiles where id = auth.uid()
  on conflict (user_id) where status = 'pending' do nothing;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.request_admin_access(text, text) to authenticated;

create or replace function public.approve_admin_request(request_id uuid)
returns boolean as $$
declare target_user uuid;
begin
  if not public.is_owner() then raise exception 'Só o dono do site pode aprovar administradores.'; end if;
  select user_id into target_user from public.admin_requests
    where id = request_id and status = 'pending';
  if target_user is null then raise exception 'Solicitação não encontrada ou já foi respondida.'; end if;
  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles set is_admin = true where id = target_user;
  update public.admin_requests set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = request_id;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.approve_admin_request(uuid) to authenticated;

create or replace function public.reject_admin_request(request_id uuid)
returns boolean as $$
begin
  if not public.is_owner() then raise exception 'Só o dono do site pode recusar solicitações.'; end if;
  update public.admin_requests set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = request_id and status = 'pending';
  if not found then raise exception 'Solicitação não encontrada ou já foi respondida.'; end if;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.reject_admin_request(uuid) to authenticated;

create or replace function public.grant_admin_access(target_user uuid)
returns boolean as $$
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode conceder acesso de administrador.'; end if;
  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles set is_admin = true where id = target_user;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.grant_admin_access(uuid) to authenticated;

create or replace function public.revoke_admin_access(target_user uuid)
returns boolean as $$
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode revogar administradores.'; end if;
  if target_user = auth.uid() then raise exception 'Você não pode revogar o próprio acesso de administrador.'; end if;
  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles set is_admin = false where id = target_user;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.revoke_admin_access(uuid) to authenticated;

create or replace function public.delete_user(target_user uuid)
returns boolean as $$
declare target_is_owner boolean;
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode excluir usuários.'; end if;
  if target_user = auth.uid() then raise exception 'Você não pode excluir a própria conta.'; end if;
  select coalesce(is_owner, false) into target_is_owner from public.profiles where id = target_user;
  if target_is_owner then raise exception 'Não é possível excluir o dono do site.'; end if;
  delete from auth.users where id = target_user;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.delete_user(uuid) to authenticated;

create or replace function public.get_site_stats()
returns jsonb as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode ver as estatísticas.'; end if;
  select jsonb_build_object(
    'users',            (select count(*) from public.profiles),
    'admins',           (select count(*) from public.profiles where is_admin = true),
    'products',         (select count(*) from public.products),
    'news',             (select count(*) from public.news),
    'media',            (select count(*) from public.media),
    'media_likes',      (select count(*) from public.media_likes),
    'events',           (select count(*) from public.events),
    'enrollments',      (select count(*) from public.event_enrollments),
    'teams',            (select count(*) from public.teams),
    'cart_items',       (select count(*) from public.cart_items),
    'pending_requests', (select count(*) from public.admin_requests where status = 'pending')
  ) into result;
  return result;
end;
$$ language plpgsql security definer;
grant execute on function public.get_site_stats() to authenticated;

create or replace function public.get_all_users()
returns table (id uuid, email text, full_name text, role text, is_admin boolean, is_owner boolean, created_at timestamptz) as $$
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode ver a lista de usuários.'; end if;
  return query
    select p.id, u.email, p.full_name, p.role,
           coalesce(p.is_admin, false), coalesce(p.is_owner, false), p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$ language plpgsql security definer;
grant execute on function public.get_all_users() to authenticated;

-- =========================================================
-- POLÍTICAS RLS BASE (perfis, produtos, comentários, etc.)
-- =========================================================
alter table public.profiles      enable row level security;
alter table public.products      enable row level security;
alter table public.product_comments enable row level security;
alter table public.news         enable row level security;
alter table public.media         enable row level security;
alter table public.media_likes   enable row level security;

-- profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles for select using (true);
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_self_not_guest" on public.profiles;
create policy "profiles_update_self_not_guest" on public.profiles
  for update using (auth.uid() = id and not public.is_guest());

-- products
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products for select using (true);
create policy "products_insert_own_not_guest" on public.products
  for insert with check (auth.uid() = seller_id and not public.is_guest());
create policy "products_update_own" on public.products
  for update using (auth.uid() = seller_id and not public.is_guest());
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = seller_id and not public.is_guest());
drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (public.is_owner());

-- comments
drop policy if exists "comments_select_public" on public.product_comments;
create policy "comments_select_public" on public.product_comments for select using (true);
create policy "comments_insert_own_not_guest" on public.product_comments
  for insert with check (auth.uid() = user_id and not public.is_guest());
create policy "comments_delete_own" on public.product_comments
  for delete using (auth.uid() = user_id and not public.is_guest());

-- news
create policy "news_select_public" on public.news for select using (true);
create policy "news_insert_admin_only" on public.news
  for insert with check (auth.uid() = author_id and public.is_admin() and not public.is_guest());
create policy "news_delete_own" on public.news
  for delete using (auth.uid() = author_id and not public.is_guest());
create policy "news_delete_owner" on public.news
  for delete using (public.is_owner());

-- media
create policy "media_select_public" on public.media for select using (true);
create policy "media_insert_own_not_guest" on public.media
  for insert with check (auth.uid() = user_id and not public.is_guest());
create policy "media_delete_own" on public.media
  for delete using (auth.uid() = user_id and not public.is_guest());
create policy "media_delete_owner" on public.media
  for delete using (public.is_owner());

-- media_likes
create policy "likes_select_public" on public.media_likes for select using (true);
create policy "likes_insert_own_not_guest" on public.media_likes
  for insert with check (auth.uid() = user_id and not public.is_guest());
create policy "likes_delete_own" on public.media_likes
  for delete using (auth.uid() = user_id);
  alter table public.events              enable row level security;
alter table public.event_enrollments  enable row level security;
alter table public.cart_items         enable row level security;
alter table public.teams             enable row level security;
alter table public.admin_requests    enable row level security;

-- events
drop policy if exists "events_select_public" on public.events;
create policy "events_select_public" on public.events for select using (true);
drop policy if exists "events_insert_admin_only" on public.events;
create policy "events_insert_admin_only" on public.events
  for insert with check (creator_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "events_update_own_admin" on public.events;
create policy "events_update_own_admin" on public.events
  for update using (creator_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "events_delete_own_admin" on public.events;
create policy "events_delete_own_admin" on public.events
  for delete using (creator_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "events_delete_owner" on public.events;
create policy "events_delete_owner" on public.events
  for delete using (public.is_owner());

-- event_enrollments
drop policy if exists "enroll_select_public" on public.event_enrollments;
create policy "enroll_select_public" on public.event_enrollments for select using (true);
drop policy if exists "enroll_insert_own_not_guest" on public.event_enrollments;
create policy "enroll_insert_own_not_guest" on public.event_enrollments
  for insert with check (auth.uid() = user_id and not public.is_guest());
drop policy if exists "enroll_delete_own" on public.event_enrollments;
create policy "enroll_delete_own" on public.event_enrollments
  for delete using (auth.uid() = user_id);

-- cart_items (privado)
drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own" on public.cart_items for select using (auth.uid() = user_id);
drop policy if exists "cart_insert_own_not_guest" on public.cart_items;
create policy "cart_insert_own_not_guest" on public.cart_items
  for insert with check (auth.uid() = user_id and not public.is_guest());
drop policy if exists "cart_update_own_not_guest" on public.cart_items;
create policy "cart_update_own_not_guest" on public.cart_items
  for update using (auth.uid() = user_id and not public.is_guest());
drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own" on public.cart_items
  for delete using (auth.uid() = user_id);

-- teams
drop policy if exists "teams_select_public" on public.teams;
create policy "teams_select_public" on public.teams for select using (true);
drop policy if exists "teams_insert_own_admin" on public.teams;
create policy "teams_insert_own_admin" on public.teams
  for insert with check (admin_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "teams_update_own_admin" on public.teams;
create policy "teams_update_own_admin" on public.teams
  for update using (admin_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "teams_delete_own_admin" on public.teams;
create policy "teams_delete_own_admin" on public.teams
  for delete using (admin_id = auth.uid() and public.is_admin() and not public.is_guest());
drop policy if exists "teams_delete_owner" on public.teams;
create policy "teams_delete_owner" on public.teams
  for delete using (public.is_owner());

-- admin_requests
drop policy if exists "requests_select_own_or_owner" on public.admin_requests;
create policy "requests_select_own_or_owner" on public.admin_requests
  for select using (auth.uid() = user_id or public.is_owner());
drop policy if exists "requests_insert_own_not_guest" on public.admin_requests;
create policy "requests_insert_own_not_guest" on public.admin_requests
  for insert with check (auth.uid() = user_id and not public.is_guest());

-- =========================================================
-- FASE 2 — MARKETPLACE: galeria, pedidos, avaliações
-- =========================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, position);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  status text default 'pending',
  total numeric not null check (total >= 0),
  shipping jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint orders_status_valid check (status in ('pending','paid','shipped','delivered','cancelled'))
);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  title text not null,
  price numeric not null check (price >= 0),
  quantity int not null check (quantity > 0 and quantity <= 99)
);

create table if not exists public.product_ratings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz default now(),
  unique (product_id, buyer_id)
);
create index if not exists product_ratings_product_idx on public.product_ratings(product_id, created_at desc);

create table if not exists public.seller_stats (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  total_sales int default 0, avg_rating numeric(3,2),
  ratings_count int default 0, updated_at timestamptz default now()
);

create or replace function public.refresh_seller_stats(target_seller uuid)
returns void as $$
declare total int; avg_r numeric; cnt int;
begin
  select count(*), avg(pr.rating)::numeric(3,2), count(pr.rating)
    into total, avg_r, cnt
  from public.order_items oi
  join public.product_ratings pr on pr.product_id = oi.product_id
  where oi.seller_id = target_seller;
  insert into public.seller_stats(seller_id, total_sales, avg_rating, ratings_count, updated_at)
  values (target_seller, coalesce(total,0), avg_r, coalesce(cnt,0), now())
  on conflict (seller_id) do update set
    total_sales = excluded.total_sales, avg_rating = excluded.avg_rating,
    ratings_count = excluded.ratings_count, updated_at = excluded.updated_at;
end;
$$ language plpgsql security definer;

create or replace function public.trg_refresh_seller_stats()
returns trigger as $$
begin
  perform public.refresh_seller_stats(
    (select seller_id from public.products where id = new.product_id));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_product_rating on public.product_ratings;
create trigger trg_product_rating after insert on public.product_ratings
  for each row execute procedure public.trg_refresh_seller_stats();

-- RPC: cria pedido atomicamente (com lock pessimista)
create or replace function public.create_order(p_items jsonb, p_shipping jsonb, p_notes text default null)
returns uuid as $$
declare v_order_id uuid; v_total numeric := 0; v_item record;
       v_price numeric; v_title text; v_seller uuid;
begin
  if public.is_guest() then raise exception 'Contas convidado não podem comprar.'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Carrinho vazio.'; end if;
  if p_shipping is null then raise exception 'Endereço de entrega é obrigatório.'; end if;

  insert into public.orders(buyer_id, status, total, shipping, notes)
  values (auth.uid(), 'pending', 0, p_shipping, p_notes)
  returning id into v_order_id;

  for v_item in
    select (elem->>'product_id')::uuid as product_id, (elem->>'quantity')::int as quantity
    from jsonb_array_elements(p_items) as elem
  loop
    select price, title, seller_id into v_price, v_title, v_seller
    from public.products where id = v_item.product_id for update;
    if not found then raise exception 'Produto não encontrado: %', v_item.product_id; end if;
    if v_item.quantity < 1 then raise exception 'Quantidade inválida para %', v_title; end if;
    v_total := v_total + (v_price * v_item.quantity);
    insert into public.order_items(order_id, product_id, seller_id, title, price, quantity)
    values (v_order_id, v_item.product_id, v_seller, v_title, v_price, v_item.quantity);
  end loop;

  update public.orders set total = v_total, updated_at = now() where id = v_order_id;
  return v_order_id;
end;
$$ language plpgsql security definer;
grant execute on function public.create_order(jsonb, jsonb, text) to authenticated;

-- RLS Fase 2
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.product_ratings  enable row level security;
alter table public.seller_stats      enable row level security;

create policy "images_select_public" on public.product_images for select using (true);
create policy "images_insert_owner" on public.product_images for insert with check (
  exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid()));
create policy "images_delete_owner" on public.product_images for delete using (
  exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid()));

create policy "orders_select_own" on public.orders for select using (auth.uid() = buyer_id);
create policy "order_items_select_buyer" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
  or seller_id = auth.uid() or public.is_owner());

create policy "ratings_select_public" on public.product_ratings for select using (true);
create policy "ratings_insert_authenticated" on public.product_ratings
  for insert with check (auth.uid() = buyer_id and not public.is_guest());
create policy "ratings_update_own" on public.product_ratings
  for update using (auth.uid() = buyer_id);
create policy "ratings_delete_own_or_owner" on public.product_ratings
  for delete using (auth.uid() = buyer_id or public.is_owner());

create policy "seller_stats_select_public" on public.seller_stats for select using (true);

-- =========================================================
-- FASE 3 — COMUNIDADE & NOTIFICAÇÕES
-- =========================================================
alter table public.profiles add column if not exists suspended_until timestamptz;
alter table public.profiles add column if not exists suspension_reason text;

create or replace function public.is_suspended(target uuid)
returns boolean as $$
  select coalesce((select suspended_until > now() from public.profiles where id = target), false);
$$ language sql stable;

create table if not exists public.follows (
  follower_id  uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id  uuid references public.profiles(id) on delete cascade,
  type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  content jsonb not null,
  read boolean default false,
  created_at timestamptz default now(),
  constraint notifications_type_valid check (type in ('follow','like','comment','rating','event','order','system'))
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, read) where read = false;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  content_id uuid not null,
  content_type text not null,
  reason text,
  status text default 'pending',
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  constraint reports_type_valid check (content_type in ('media','news','product','comment','rating','team','profile')),
  constraint reports_status_valid check (status in ('pending','resolved','dismissed'))
);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

create or replace function public.create_notification(p_user_id uuid, p_type text, p_actor_id uuid, p_content jsonb)
returns void as $$
begin
  if p_user_id = p_actor_id then return; end if;
  insert into public.notifications(user_id, type, actor_id, content)
  select p_user_id, p_type, p_actor_id, p_content
  where not exists (
    select 1 from public.notifications n
    where n.user_id = p_user_id and n.actor_id = p_actor_id
      and n.type = p_type and n.content->>'ref_id' = p_content->>'ref_id'
      and n.read = false);
end;
$$ language plpgsql security definer;

-- Triggers para notificações automáticas
create or replace function public.trg_notify_new_follow() returns trigger as $$
begin
  perform public.create_notification(new.following_id, 'follow', new.follower_id,
    jsonb_build_object('ref_id', new.follower_id::text, 'ref_type', 'profile'));
  return new;
end; $$ language plpgsql;
create trigger trg_follow_notify after insert on public.follows
  for each row execute procedure public.trg_notify_new_follow();

create or replace function public.trg_notify_media_like() returns trigger as $$
declare v_owner uuid; begin
  select user_id into v_owner from public.media where id = new.media_id;
  perform public.create_notification(v_owner, 'like', new.user_id,
    jsonb_build_object('ref_id', new.media_id::text, 'ref_type', 'media'));
  return new;
end; $$ language plpgsql;
create trigger trg_like_notify after insert on public.media_likes
  for each row execute procedure public.trg_notify_media_like();

create or replace function public.trg_notify_product_comment() returns trigger as $$
declare v_owner uuid; begin
  select seller_id into v_owner from public.products where id = new.product_id;
  perform public.create_notification(v_owner, 'comment', new.user_id,
    jsonb_build_object('ref_id', new.product_id::text, 'ref_type', 'product'));
  return new;
end; $$ language plpgsql;
create trigger trg_comment_notify after insert on public.product_comments
  for each row execute procedure public.trg_notify_product_comment();

create or replace function public.trg_notify_product_rating() returns trigger as $$
declare v_owner uuid; begin
  select seller_id into v_owner from public.products where id = new.product_id;
  perform public.create_notification(v_owner, 'rating', new.buyer_id,
    jsonb_build_object('ref_id', new.product_id::text, 'ref_type', 'product', 'rating', new.rating));
  return new;
end; $$ language plpgsql;
create trigger trg_rating_notify after insert on public.product_ratings
  for each row execute procedure public.trg_notify_product_rating();

create or replace function public.get_follow_counts(target uuid)
returns table (followers int, following int) as $$
begin
  return query select (select count(*)::int from public.follows where following_id = target),
                       (select count(*)::int from public.follows where follower_id = target);
end;
$$ language sql stable;
grant execute on function public.get_follow_counts(uuid) to authenticated;

-- RLS FASE 3
alter table public.follows       enable row level security;
alter table public.notifications  enable row level security;
alter table public.reports        enable row level security;

create policy "follows_select_public" on public.follows for select using (true);
create policy "follows_insert_self" on public.follows for insert with check (auth.uid() = follower_id and not public.is_guest());
create policy "follows_delete_self" on public.follows for delete using (auth.uid() = follower_id);

create policy "notif_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notif_delete_own" on public.notifications for delete using (auth.uid() = user_id);

create policy "reports_select_own_or_owner" on public.reports
  for select using (auth.uid() = reporter_id or public.is_owner());
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() = reporter_id and not public.is_guest());
create policy "reports_update_owner" on public.reports for update using (public.is_owner());

-- =========================================================
-- FASE 4 — AGENDA AVANÇADA + EQUIPES
-- =========================================================
create table if not exists public.event_attendance (
  event_id uuid references public.events(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  checked_in_at timestamptz,
  qr_token uuid default gen_random_uuid() unique not null,
  rating int check (rating is null or rating between 1 and 5),
  feedback text check (feedback is null or char_length(feedback) <= 500),
  primary key (event_id, user_id)
);
create index if not exists event_attendance_token_idx on public.event_attendance(qr_token);

create table if not exists public.team_stats (
  team_id uuid primary key references public.teams(id) on delete cascade,
  members_count int default 0, total_events int default 0,
  avg_attendance numeric(5,2) default 0, avg_rating numeric(3,2),
  updated_at timestamptz default now()
);

create or replace function public.check_in_event(p_qr_token uuid)
returns boolean as $$
declare v_event_id uuid; v_user_id uuid; v_owner_id uuid;
begin
  select event_id, user_id into v_event_id, v_user_id
  from public.event_attendance where qr_token = p_qr_token;
  if v_event_id is null then raise exception 'QR code inválido.'; end if;
  select creator_id into v_owner_id from public.events where id = v_event_id;
  if v_owner_id <> auth.uid() and v_user_id <> auth.uid() then
    raise exception 'Apenas o organizador ou o próprio inscrito pode fazer check-in.'; end if;
  update public.event_attendance set checked_in_at = now()
  where qr_token = p_qr_token and checked_in_at is null;
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.check_in_event(uuid) to authenticated;

create or replace function public.refresh_team_stats(target_team uuid)
returns void as $$
declare v_members int; v_events int; v_avg_att numeric; v_avg_rating numeric;
begin
  select count(*) into v_members from public.profiles where team_id = target_team;
  select count(*) into v_events from public.events where team_id = target_team;
  select case when count(*) = 0 then 0
    else (count(checked_in_at)::numeric / count(*)::numeric) * 100 end into v_avg_att
  from public.event_attendance ea join public.events e on e.id = ea.event_id
  where e.team_id = target_team;
  select coalesce(avg(rating), 0) into v_avg_rating from public.event_attendance ea
    join public.events e on e.id = ea.event_id where e.team_id = target_team and ea.rating is not null;
  insert into public.team_stats(team_id, members_count, total_events, avg_attendance, avg_rating, updated_at)
  values (target_team, coalesce(v_members,0), coalesce(v_events,0), v_avg_att, v_avg_rating, now())
  on conflict (team_id) do update set
    members_count = excluded.members_count, total_events = excluded.total_events,
    avg_attendance = excluded.avg_attendance, avg_rating = excluded.avg_rating,
    updated_at = excluded.updated_at;
end;
$$ language plpgsql security definer;

create or replace function public.trg_refresh_team_stats()
returns trigger as $$
begin
  perform public.refresh_team_stats(
    (select team_id from public.events where id = coalesce(new.event_id, old.event_id)));
  return coalesce(new, old);
end; $$ language plpgsql;
create trigger trg_team_stats_attendance after insert or update or delete on public.event_attendance
  for each row execute procedure public.trg_refresh_team_stats();

-- RLS FASE 4
alter table public.event_attendance enable row level security;
alter table public.team_stats        enable row level security;

create policy "attendance_select_self_or_owner" on public.event_attendance for select using (
  auth.uid() = user_id
  or exists (select 1 from public.events e where e.id = event_id and e.creator_id = auth.uid())
  or public.is_owner());
create policy "attendance_insert_self" on public.event_attendance
  for insert with check (auth.uid() = user_id and not public.is_guest());
create policy "attendance_update_authorized" on public.event_attendance
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.events e where e.id = event_id and e.creator_id = auth.uid()));

create policy "team_stats_select_public" on public.team_stats for select using (true);

-- =========================================================
-- FASE 5 — ANALYTICS & MODERAÇÃO AVANÇADA
-- =========================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text, target_id uuid, details jsonb,
  ip_address text,
  created_at timestamptz default now(),
  constraint audit_action_valid check (action in
    ('grant_admin','revoke_admin','delete_user','delete_content',
     'approve_request','reject_request','resolve_report',
     'suspend','unsuspend','update_settings'))
);
create index if not exists audit_actor_idx on public.audit_log(actor_id, created_at desc);
create index if not exists audit_action_idx on public.audit_log(action, created_at desc);

create or replace function public.log_admin_action(p_action text, p_target_type text, p_target_id uuid, p_details jsonb default null)
returns void as $$
begin
  if not public.is_owner() then raise exception 'Apenas o dono do site pode registrar ações administrativas.'; end if;
  insert into public.audit_log(actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_details);
end;
$$ language plpgsql security definer;
grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;

create or replace function public.suspend_user(p_target uuid, p_days int, p_reason text default null)
returns boolean as $$
declare v_until timestamptz;
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode suspender usuários.'; end if;
  if p_target = auth.uid() then raise exception 'Você não pode suspender a própria conta.'; end if;
  if p_days < 1 or p_days > 365 then raise exception 'Período de suspensão deve ser entre 1 e 365 dias.'; end if;
  v_until := now() + (p_days || ' days')::interval;
  update public.profiles set suspended_until = v_until, suspension_reason = p_reason where id = p_target;
  perform public.log_admin_action('suspend', 'user', p_target,
    jsonb_build_object('days', p_days, 'until', v_until, 'reason', p_reason));
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.suspend_user(uuid, int, text) to authenticated;

create or replace function public.unsuspend_user(p_target uuid)
returns boolean as $$
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode remover suspensão.'; end if;
  update public.profiles set suspended_until = null, suspension_reason = null where id = p_target;
  perform public.log_admin_action('unsuspend', 'user', p_target, null);
  return true;
end;
$$ language plpgsql security definer;
grant execute on function public.unsuspend_user(uuid) to authenticated;

create or replace function public.get_analytics()
returns jsonb as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'Somente o dono do site pode ver analytics.'; end if;
  select jsonb_build_object(
    'signups_30d', (select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'count', c) order by d), '[]'::jsonb)
      from (select date_trunc('day', created_at)::date as d, count(*) as c from public.profiles
            where created_at > now() - interval '30 days' group by 1) s),
    'top_sports', (select coalesce(jsonb_agg(jsonb_build_object('sport', sport, 'count', c) order by c desc), '[]'::jsonb)
      from (select unnest(sports) as sport, count(*) as c from public.profiles
            where sports <> '{}' group by 1 order by 2 desc limit 5) s),
    'marketplace_revenue', (select coalesce(sum(total * 0.05), 0) from public.orders
      where status in ('paid','shipped','delivered') and created_at > now() - interval '30 days'),
    'orders_by_status', (select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', c) order by status), '[]'::jsonb)
      from (select status, count(*) as c from public.orders
            where created_at > now() - interval '30 days' group by 1) s),
    'conversion_funnel', jsonb_build_object(
      'signups_30d',  (select count(*) from public.profiles where created_at > now() - interval '30 days'),
      'active_30d',    (select count(distinct user_id) from public.event_enrollments where created_at > now() - interval '30 days'),
      'purchases_30d', (select count(*) from public.orders where created_at > now() - interval '30 days')),
    'event_signups_30d', (select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'count', c) order by d), '[]'::jsonb)
      from (select date_trunc('day', created_at)::date as d, count(*) as c from public.event_enrollments
            where created_at > now() - interval '30 days' group by 1) s),
    'top_events', (select coalesce(jsonb_agg(jsonb_build_object('id', event_id, 'title', title, 'signups', c) order by c desc), '[]'::jsonb)
      from (select ee.event_id, e.title, count(*) as c from public.event_enrollments ee
            join public.events e on e.id = ee.event_id
            where ee.created_at > now() - interval '30 days' group by 1, 2 order by 3 desc limit 5) s)
  ) into result;
  return result;
end;
$$ language plpgsql security definer;
grant execute on function public.get_analytics() to authenticated;

-- RLS FASE 5
alter table public.audit_log  enable row level security;
alter table public.profiles    enable row level security;

create policy "audit_select_owner" on public.audit_log for select using (public.is_owner());

-- Bloqueia escrita de suspensos em conteúdo
drop policy if exists "products_insert_own_not_guest" on public.products;
create policy "products_insert_own_not_guest" on public.products
  for insert with check (auth.uid() = seller_id and not public.is_guest() and not public.is_suspended(auth.uid()));
drop policy if exists "media_insert_own_not_guest" on public.media;
create policy "media_insert_own_not_guest" on public.media
  for insert with check (auth.uid() = user_id and not public.is_guest() and not public.is_suspended(auth.uid()));
drop policy if exists "news_insert_admin_only" on public.news;
create policy "news_insert_admin_only" on public.news
  for insert with check (auth.uid() = author_id and public.is_admin() and not public.is_guest() and not public.is_suspended(auth.uid()));
drop policy if exists "comments_insert_own_not_guest" on public.product_comments;
create policy "comments_insert_own_not_guest" on public.product_comments
  for insert with check (auth.uid() = user_id and not public.is_guest() and not public.is_suspended(auth.uid()));
drop policy if exists "events_insert_admin_only" on public.events;
create policy "events_insert_admin_only" on public.events
  for insert with check (creator_id = auth.uid() and public.is_admin() and not public.is_guest() and not public.is_suspended(auth.uid()));

-- =========================================================
-- STORAGE — buckets públicos
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true),('products','products',true),('news','news',true),
       ('media','media',true),('teams','teams',true)
on conflict (id) do nothing;

create policy "public_read_avatars"   on storage.objects for select using (bucket_id = 'avatars');
create policy "public_read_products"   on storage.objects for select using (bucket_id = 'products');
create policy "public_read_news"      on storage.objects for select using (bucket_id = 'news');
create policy "public_read_media"     on storage.objects for select using (bucket_id = 'media');
create policy "public_read_teams"     on storage.objects for select using (bucket_id = 'teams');

create policy "auth_upload_avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated' and not public.is_guest());
create policy "auth_upload_products" on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated' and not public.is_guest());
create policy "auth_upload_news" on storage.objects for insert
  with check (bucket_id = 'news' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin());
create policy "auth_upload_media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated' and not public.is_guest());
create policy "auth_upload_teams" on storage.objects for insert
  with check (bucket_id = 'teams' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin());

create policy "owner_delete_avatars"  on storage.objects for delete using (bucket_id = 'avatars'  and owner = auth.uid());
create policy "owner_delete_products"  on storage.objects for delete using (bucket_id = 'products'  and owner = auth.uid());
create policy "owner_delete_news"     on storage.objects for delete using (bucket_id = 'news'     and owner = auth.uid());
create policy "owner_delete_media"    on storage.objects for delete using (bucket_id = 'media'    and owner = auth.uid());
create policy "owner_delete_teams"    on storage.objects for delete using (bucket_id = 'teams'    and owner = auth.uid());

-- =========================================================
-- DADOS DE EXEMPLO — eventos iniciais na Agenda
-- =========================================================
insert into public.events (title, type, sport, description, location, event_date)
select * from (values
  ('Treino de Judô — Fundamentos', 'treino', 'Judô', 'Treino aberto focado em quedas e imobilizações.', 'Academia Central', now() + interval '3 days'),
  ('Campeonato Regional de Jiu-jitsu', 'campeonato', 'Jiu-jitsu', 'Competição classificatória para o estadual.', 'Ginásio Municipal', now() + interval '10 days'),
  ('Treino Funcional — Basquete', 'treino', 'Basquete', 'Treino de condicionamento e arremessos.', 'Quadra CoreMotion', now() + interval '5 days'),
  ('Copa CoreMotion de Vôlei', 'campeonato', 'Vôlei', 'Torneio aberto entre equipes da comunidade.', 'Arena CoreMotion', now() + interval '15 days')
) as v(title, type, sport, description, location, event_date)
where not exists (select 1 from public.events);

-- =========================================================
-- FIM DO SCRIPT
-- =========================================================
-- ===== 0002 — storage hardening =====
-- =========================================================
-- 0002 — endurece uploads no Storage (B3)
--   1. Só o dono da conta pode gravar dentro da própria pasta:
--      (storage.foldername(name))[1] = auth.uid()
--   2. Teto de tamanho por objeto (best-effort via metadata):
--      5 MB para imagem, 50 MB para o bucket de mídia (vídeo).
--      Se o storage não preencher metadata ainda, o check passa
--      (coalesce) para não quebrar uploads; o limite forte fica
--      também no cliente (validation.js / db.js) e, para rigor
--      total, pode ser reforçado por um Storage webhook.
-- Idempotente: drop + create.
-- ⚠ NÃO testada contra um banco real neste ambiente (sem acesso
--   ao Supabase). Validar no staging antes de produção.
-- =========================================================

drop policy if exists auth_upload_avatars on storage.objects;
create policy auth_upload_avatars on storage.objects for insert
  with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated' and not public.is_guest()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
  );

drop policy if exists auth_upload_products on storage.objects;
create policy auth_upload_products on storage.objects for insert
  with check (
    bucket_id = 'products' and auth.role() = 'authenticated' and not public.is_guest()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
  );

drop policy if exists auth_upload_news on storage.objects;
create policy auth_upload_news on storage.objects for insert
  with check (
    bucket_id = 'news' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
  );

drop policy if exists auth_upload_media on storage.objects;
create policy auth_upload_media on storage.objects for insert
  with check (
    bucket_id = 'media' and auth.role() = 'authenticated' and not public.is_guest()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((metadata->>'size')::bigint, 0) <= 50 * 1024 * 1024
  );

drop policy if exists auth_upload_teams on storage.objects;
create policy auth_upload_teams on storage.objects for insert
  with check (
    bucket_id = 'teams' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
  );

-- ===== 0003 — privacidade de profiles =====
-- =========================================================
-- 0003 — privacidade real do perfil (B5)
--   A policy antiga era `using (true)`: qualquer anônimo lia
--   todos os perfis, e o toggle "perfil público" não fazia nada.
--   Agora: um perfil só é legível por terceiros se estiver
--   público; o próprio dono e os admins sempre leem o seu.
--   NULL de public_profile conta como público (default true).
--   ⚠ Efeito colateral esperado: joins `profiles(full_name)` de
--     perfis privados voltam vazios no PostgREST (comentários,
--     equipes) — é o comportamento de privacidade correto.
-- ⚠ NÃO testada contra um banco real neste ambiente.
-- =========================================================

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles for select using (
  public_profile is not false
  or id = auth.uid()
  or public.is_admin()
);
