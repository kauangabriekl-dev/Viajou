-- ============================================================================
-- VIAJOU — Storage
-- Bucket "photos": leitura pública, escrita apenas na pasta do próprio usuário.
-- Caminho obrigatório: <user_id>/<contexto>/<arquivo>
-- Limite de 5 MB e somente JPEG, PNG e WebP (validado também no servidor).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Fotos são públicas para leitura" on storage.objects for select
  using (bucket_id = 'photos');

create policy "Usuário envia para a própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuário remove da própria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
