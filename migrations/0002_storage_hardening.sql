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
