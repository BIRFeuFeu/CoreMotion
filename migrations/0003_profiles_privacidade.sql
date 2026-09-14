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
