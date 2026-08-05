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
  title text,                        -- cargo de admin, ex: "Técnico Chefe" (opcional)
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
  tagline text,                 -- frase curta de destaque
  description text,             -- texto livre "sobre a equipe"
  location text,
  contact text,
  logo_url text,
  cover_url text,
  primary_color text default '#e5383b',
  created_at timestamptz default now()
);

-- agora que "teams" existe, ligamos profiles.team_id a ela
alter table public.profiles drop constraint if exists profiles_team_id_fkey;
alter table public.profiles add constraint profiles_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;
-- (o vínculo de events.team_id -> teams.id é criado mais abaixo,
-- depois que a tabela events for criada)

-- =========================================================
-- 1c. TABELA: admin_requests
-- Pedido de "quero virar administrador", feito pelo usuário ao
-- escolher a função Técnico. Fica pendente até você (o dono do
-- site) aprovar ou recusar — ver seção "Configurações → Conta"
-- no app e o painel do dono mais abaixo.
-- =========================================================
drop table if exists public.admin_invite_codes cascade;
drop function if exists public.redeem_admin_code(text);

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text,
  email text,
  team_name text,
  message text,
  status text default 'pending',        -- 'pending' | 'approved' | 'rejected'
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- só permite 1 pedido "pendente" por usuário de cada vez
drop index if exists admin_requests_one_pending;
create unique index admin_requests_one_pending
  on public.admin_requests(user_id) where status = 'pending';

-- =========================================================
-- 2. TABELA: products (Marketplace)
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- 3. TABELA: product_comments
-- =========================================================
create table if not exists public.product_comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- =========================================================
-- 4. TABELA: news
-- =========================================================
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  category text,
  image_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- 5. TABELA: media
-- =========================================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  media_type text default 'image',
  url text not null,
  caption text,
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
  type text default 'treino',      -- 'treino' | 'campeonato'
  sport text,
  description text,
  location text,
  event_date timestamptz,
  creator_id uuid references public.profiles(id) on delete set null,
  team_id uuid,
  created_at timestamptz default now()
);
alter table public.events add column if not exists creator_id uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists team_id uuid;
alter table public.events drop constraint if exists events_team_id_fkey;
alter table public.events add constraint events_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

-- =========================================================
-- 8. TABELA: event_enrollments (inscrições dos usuários)
-- =========================================================
create table if not exists public.event_enrollments (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- =========================================================
-- 9. TABELA: cart_items (carrinho de compras)
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
-- dono, de cara, sem precisar de aprovação). Troque para o seu
-- e-mail antes de rodar este script.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  owner_email text := 'alfeuvlp@gmail.com';  -- <<< troque aqui se precisar
  is_the_owner boolean := (lower(new.email) = lower(owner_email));
  meta_name text := coalesce(
    new.raw_user_meta_data->>'full_name',  -- cadastro por e-mail (nós enviamos isso)
    new.raw_user_meta_data->>'name',       -- login com Google manda "name"
    'Novo Atleta'
  );
  meta_avatar text := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'     -- login com Google manda "picture"
  );
begin
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

-- Conserto retroativo: se você (dono) já tinha criado a conta ANTES
-- de rodar esta versão do script, este bloco corrige seu perfil agora.
do $$
begin
  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles p
  set is_owner = true, is_admin = true
  from auth.users u
  where p.id = u.id and lower(u.email) = lower('alfeuvlp@gmail.com');
end $$;

-- =========================================================
-- FUNÇÃO: public.is_guest()
-- Lê o claim "is_anonymous" do token JWT do usuário logado.
-- O Supabase marca automaticamente contas de login anônimo
-- (usadas pelo botão "Entrar como Convidado") com esse claim.
-- Usamos isso nas políticas abaixo para bloquear ESCRITA de
-- convidados diretamente no banco — não só na tela.
-- =========================================================
create or replace function public.is_guest()
returns boolean as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$ language sql stable;

-- =========================================================
-- FUNÇÃO: public.is_admin()
-- Confere se o usuário logado tem is_admin = true na tabela
-- profiles. Usada nas políticas de events/news/teams.
-- =========================================================
create or replace function public.is_admin()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql stable;

-- =========================================================
-- FUNÇÃO: public.is_owner()
-- Confere se o usuário logado é o DONO do site (is_owner = true
-- na tabela profiles). Só o dono aprova/recusa pedidos de admin.
-- =========================================================
create or replace function public.is_owner()
returns boolean as $$
  select coalesce((select is_owner from public.profiles where id = auth.uid()), false);
$$ language sql stable;

-- =========================================================
-- TRIGGER DE PROTEÇÃO: ninguém consegue virar admin OU dono só
-- dando update na própria linha de profiles (isso seria uma falha
-- de segurança grave, já que profiles_update_self permite update
-- de qualquer coluna pelo dono da linha). is_admin e is_owner só
-- mudam dentro das funções approve_admin_request()/handle_new_user(),
-- que ligam uma flag de sessão (app.allow_admin_change) antes do update.
-- =========================================================
create or replace function public.protect_admin_flag()
returns trigger as $$
begin
  if coalesce(current_setting('app.allow_admin_change', true), '') <> 'true' then
    if NEW.is_admin is distinct from OLD.is_admin then
      NEW.is_admin := OLD.is_admin;
    end if;
    if NEW.is_owner is distinct from OLD.is_owner then
      NEW.is_owner := OLD.is_owner;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_protect_admin_flag on public.profiles;
create trigger trg_protect_admin_flag
  before update on public.profiles
  for each row execute procedure public.protect_admin_flag();

-- =========================================================
-- FUNÇÃO (RPC): public.request_admin_access(team_name, message)
-- Chamada quando o usuário escolhe a função "Técnico" (ou clica em
-- "Solicitar acesso" nas Configurações). Só cria o PEDIDO — quem
-- decide de verdade é o dono, usando approve/reject abaixo.
-- =========================================================
create or replace function public.request_admin_access(p_team_name text, p_message text default null)
returns boolean as $$
begin
  if public.is_guest() then
    raise exception 'Contas convidado não podem solicitar acesso de administrador.';
  end if;
  if public.is_admin() then
    raise exception 'Esta conta já é administradora.';
  end if;

  insert into public.admin_requests (user_id, full_name, email, team_name, message)
  select id, full_name, (select email from auth.users where id = auth.uid()), p_team_name, p_message
  from public.profiles where id = auth.uid()
  on conflict (user_id) where status = 'pending' do nothing;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function public.request_admin_access(text, text) to authenticated;

-- =========================================================
-- FUNÇÃO (RPC): public.approve_admin_request(request_id)
-- Só o dono do site pode chamar. Libera is_admin = true para
-- quem pediu, e marca a solicitação como aprovada.
-- =========================================================
create or replace function public.approve_admin_request(request_id uuid)
returns boolean as $$
declare
  target_user uuid;
begin
  if not public.is_owner() then
    raise exception 'Só o dono do site pode aprovar administradores.';
  end if;

  select user_id into target_user from public.admin_requests
  where id = request_id and status = 'pending';

  if target_user is null then
    raise exception 'Solicitação não encontrada ou já foi respondida.';
  end if;

  perform set_config('app.allow_admin_change', 'true', true);
  update public.profiles set is_admin = true where id = target_user;

  update public.admin_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = request_id;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function public.approve_admin_request(uuid) to authenticated;

-- =========================================================
-- FUNÇÃO (RPC): public.reject_admin_request(request_id)
-- Só o dono do site pode chamar. Marca a solicitação como recusada
-- (a pessoa pode enviar um novo pedido depois, se quiser).
-- =========================================================
create or replace function public.reject_admin_request(request_id uuid)
returns boolean as $$
begin
  if not public.is_owner() then
    raise exception 'Só o dono do site pode recusar solicitações.';
  end if;

  update public.admin_requests
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
  where id = request_id and status = 'pending';

  if not found then
    raise exception 'Solicitação não encontrada ou já foi respondida.';
  end if;

  return true;
end;
$$ language plpgsql security definer;

grant execute on function public.reject_admin_request(uuid) to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_comments enable row level security;
alter table public.news enable row level security;
alter table public.media enable row level security;
alter table public.media_likes enable row level security;
alter table public.events enable row level security;
alter table public.event_enrollments enable row level security;
alter table public.cart_items enable row level security;
alter table public.teams enable row level security;
alter table public.admin_requests enable row level security;

-- ---- profiles ----
-- Leitura pública (perfis são visíveis a todos), mas só o próprio
-- dono edita, e só se NÃO for conta convidado.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_update_self_not_guest" on public.profiles;
create policy "profiles_update_self_not_guest" on public.profiles
  for update using (auth.uid() = id and not public.is_guest());

-- ---- products ----
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products for select using (true);

drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_insert_own_not_guest" on public.products;
create policy "products_insert_own_not_guest" on public.products
  for insert with check (auth.uid() = seller_id and not public.is_guest());

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products
  for update using (auth.uid() = seller_id and not public.is_guest());

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = seller_id and not public.is_guest());

-- ---- product_comments ----
drop policy if exists "comments_select_public" on public.product_comments;
create policy "comments_select_public" on public.product_comments for select using (true);

drop policy if exists "comments_insert_own" on public.product_comments;
drop policy if exists "comments_insert_own_not_guest" on public.product_comments;
create policy "comments_insert_own_not_guest" on public.product_comments
  for insert with check (auth.uid() = user_id and not public.is_guest());

drop policy if exists "comments_delete_own" on public.product_comments;
create policy "comments_delete_own" on public.product_comments
  for delete using (auth.uid() = user_id and not public.is_guest());

-- ---- news ----
drop policy if exists "news_select_public" on public.news;
create policy "news_select_public" on public.news for select using (true);

drop policy if exists "news_insert_own" on public.news;
drop policy if exists "news_insert_own_not_guest" on public.news;
drop policy if exists "news_insert_admin_only" on public.news;
create policy "news_insert_admin_only" on public.news
  for insert with check (auth.uid() = author_id and public.is_admin() and not public.is_guest());

drop policy if exists "news_delete_own" on public.news;
create policy "news_delete_own" on public.news
  for delete using (auth.uid() = author_id and not public.is_guest());

-- ---- media ----
drop policy if exists "media_select_public" on public.media;
create policy "media_select_public" on public.media for select using (true);

drop policy if exists "media_insert_own" on public.media;
drop policy if exists "media_insert_own_not_guest" on public.media;
create policy "media_insert_own_not_guest" on public.media
  for insert with check (auth.uid() = user_id and not public.is_guest());

drop policy if exists "media_delete_own" on public.media;
create policy "media_delete_own" on public.media
  for delete using (auth.uid() = user_id and not public.is_guest());

-- ---- media_likes ----
drop policy if exists "likes_select_public" on public.media_likes;
create policy "likes_select_public" on public.media_likes for select using (true);

drop policy if exists "likes_insert_own" on public.media_likes;
drop policy if exists "likes_insert_own_not_guest" on public.media_likes;
create policy "likes_insert_own_not_guest" on public.media_likes
  for insert with check (auth.uid() = user_id and not public.is_guest());

drop policy if exists "likes_delete_own" on public.media_likes;
create policy "likes_delete_own" on public.media_likes
  for delete using (auth.uid() = user_id and not public.is_guest());

-- ---- events ----
-- Leitura pública. Só administradores criam/editam/apagam eventos.
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

-- ---- event_enrollments ----
drop policy if exists "enroll_select_public" on public.event_enrollments;
create policy "enroll_select_public" on public.event_enrollments for select using (true);

drop policy if exists "enroll_insert_own_not_guest" on public.event_enrollments;
create policy "enroll_insert_own_not_guest" on public.event_enrollments
  for insert with check (auth.uid() = user_id and not public.is_guest());

drop policy if exists "enroll_delete_own" on public.event_enrollments;
create policy "enroll_delete_own" on public.event_enrollments
  for delete using (auth.uid() = user_id and not public.is_guest());

-- ---- cart_items ----
-- Totalmente privado: cada um só vê/mexe no próprio carrinho.
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

-- ---- teams (página da equipe) ----
-- Qualquer pessoa (inclusive convidado) pode ver as páginas de equipe.
-- Só quem é admin cria/edita/apaga, e sempre a própria equipe (admin_id = auth.uid()).
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

-- ---- admin_requests ----
-- Cada um vê só o próprio pedido; o dono do site vê todos (pra aprovar).
-- Ninguém faz update/delete direto — isso só acontece dentro das
-- funções approve_admin_request / reject_admin_request (security definer).
drop policy if exists "requests_select_own_or_owner" on public.admin_requests;
create policy "requests_select_own_or_owner" on public.admin_requests
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "requests_insert_own_not_guest" on public.admin_requests;
create policy "requests_insert_own_not_guest" on public.admin_requests
  for insert with check (auth.uid() = user_id and not public.is_guest());

-- =========================================================
-- STORAGE — buckets para as imagens/arquivos enviados
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('news', 'news', true),
  ('media', 'media', true),
  ('teams', 'teams', true)
on conflict (id) do nothing;

drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "public_read_products" on storage.objects;
create policy "public_read_products" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "public_read_news" on storage.objects;
create policy "public_read_news" on storage.objects for select using (bucket_id = 'news');
drop policy if exists "public_read_media" on storage.objects;
create policy "public_read_media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "public_read_teams" on storage.objects;
create policy "public_read_teams" on storage.objects for select using (bucket_id = 'teams');

-- Só contas com e-mail podem ENVIAR arquivos (convidado fica de fora)
drop policy if exists "auth_upload_avatars" on storage.objects;
create policy "auth_upload_avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated' and not public.is_guest());
drop policy if exists "auth_upload_products" on storage.objects;
create policy "auth_upload_products" on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated' and not public.is_guest());
drop policy if exists "auth_upload_news" on storage.objects;
create policy "auth_upload_news" on storage.objects for insert
  with check (bucket_id = 'news' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin());
drop policy if exists "auth_upload_media" on storage.objects;
create policy "auth_upload_media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated' and not public.is_guest());
-- Fotos de equipe (logo/capa) só podem ser enviadas por administradores
drop policy if exists "auth_upload_teams" on storage.objects;
create policy "auth_upload_teams" on storage.objects for insert
  with check (bucket_id = 'teams' and auth.role() = 'authenticated' and not public.is_guest() and public.is_admin());

drop policy if exists "owner_delete_avatars" on storage.objects;
create policy "owner_delete_avatars" on storage.objects for delete using (bucket_id = 'avatars' and owner = auth.uid());
drop policy if exists "owner_delete_products" on storage.objects;
create policy "owner_delete_products" on storage.objects for delete using (bucket_id = 'products' and owner = auth.uid());
drop policy if exists "owner_delete_news" on storage.objects;
create policy "owner_delete_news" on storage.objects for delete using (bucket_id = 'news' and owner = auth.uid());
drop policy if exists "owner_delete_media" on storage.objects;
create policy "owner_delete_media" on storage.objects for delete using (bucket_id = 'media' and owner = auth.uid());
drop policy if exists "owner_delete_teams" on storage.objects;
create policy "owner_delete_teams" on storage.objects for delete using (bucket_id = 'teams' and owner = auth.uid());

-- =========================================================
-- DADOS DE EXEMPLO — alguns eventos para a Agenda não ficar vazia.
-- Pode apagar ou editar essas linhas livremente no Table Editor.
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
