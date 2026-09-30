-- ============================================================================
-- Testes de banco: permissões (RLS), constraints e triggers.
-- Executar com: npm run test:db  (requer PostgreSQL local; ver README)
-- Cada bloco troca de papel com tests.as_user()/tests.as_anon() e reset role.
-- ============================================================================
\set ON_ERROR_STOP 1
\set QUIET 1

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.ok(condition boolean, message text) returns void
language plpgsql as $$
begin
  if condition is not true then raise exception 'FALHOU: %', message; end if;
  raise notice 'ok - %', message;
end $$;

-- Espera que a instrução falhe com o SQLSTATE informado.
create or replace function tests.throws(statement text, expected text, message text) returns void
language plpgsql as $$
declare failed boolean := false; got text;
begin
  begin
    execute statement;
  exception when others then
    failed := true; got := sqlstate;
  end;
  if not failed then raise exception 'FALHOU: % (nenhum erro)', message; end if;
  if got <> expected then raise exception 'FALHOU: % (esperado %, veio %)', message, expected, got; end if;
  raise notice 'ok - %', message;
end $$;

-- Quantas linhas uma instrução afetou (RLS em UPDATE/DELETE filtra em silêncio).
create or replace function tests.affected(statement text) returns int
language plpgsql as $$
declare n int;
begin
  execute statement; get diagnostics n = row_count; return n;
end $$;

create or replace function tests.as_user(uid uuid) returns void
language sql as $$ select set_config('request.jwt.claim.sub', uid::text, false) $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Autenticação: perfil criado no cadastro, username único
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@teste.local', '{"username":"ana_teste","full_name":"Ana Teste"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@teste.local', '{"username":"beto_teste","full_name":"Beto Teste"}'),
  ('00000000-0000-0000-0000-00000000000c', 'oauth.user@teste.local', '{}');

select tests.ok((select count(*) = 3 from public.profiles), 'cadastro cria perfil automaticamente');
select tests.ok((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000c') ~ '^oauthuser_[a-f0-9]{6}$',
  'OAuth sem username recebe username provisório válido');
select tests.throws($$insert into auth.users (email, raw_user_meta_data) values ('x@teste.local', '{"username":"ana_teste","full_name":"X"}')$$,
  '23505', 'username duplicado impede o cadastro');
select tests.throws($$insert into auth.users (email, raw_user_meta_data) values ('y@teste.local', '{"username":"Nome Inválido!","full_name":"Y"}')$$,
  '23514', 'username com formato inválido é rejeitado');

-- ---------------------------------------------------------------------------
-- Visitante (anon): lê conteúdo público, não escreve
-- ---------------------------------------------------------------------------
select tests.as_user(null);
set role anon;
select tests.ok((select count(*) > 0 from public.destinations), 'visitante lê destinos');
select tests.throws($$insert into public.posts (user_id, body) values ('00000000-0000-0000-0000-00000000000a', 'tentativa anônima')$$,
  '42501', 'visitante não cria publicação');
reset role;

-- ---------------------------------------------------------------------------
-- Publicações
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
insert into public.posts (id, user_id, body) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Relato de teste da Ana.');
select tests.throws($$insert into public.posts (user_id, body) values ('00000000-0000-0000-0000-00000000000b', 'fingindo ser o Beto')$$,
  '42501', 'usuário não cria publicação em nome de outro');
select tests.throws($$insert into public.post_photos (post_id, user_id, storage_path) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b/posts/x.jpg')$$,
  '42501', 'foto só pode apontar para a pasta do próprio usuário');
reset role;

select tests.as_user('00000000-0000-0000-0000-00000000000b');
set role authenticated;
select tests.ok(tests.affected($$update public.posts set body = 'editado pelo Beto!!' where id = '10000000-0000-0000-0000-000000000001'$$) = 0,
  'usuário não edita publicação alheia');
select tests.ok(tests.affected($$delete from public.posts where id = '10000000-0000-0000-0000-000000000001'$$) = 0,
  'usuário não exclui publicação alheia');

-- Curtidas
insert into public.post_likes (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');
select tests.throws($$insert into public.post_likes (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b')$$,
  '23505', 'curtida duplicada é bloqueada');
select tests.ok(tests.affected($$delete from public.post_likes where post_id = '10000000-0000-0000-0000-000000000001' and user_id = auth.uid()$$) = 1,
  'usuário descurte');
insert into public.post_likes (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');

-- Comentários
insert into public.comments (id, post_id, user_id, body) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'Ótimo relato!');
insert into public.post_saves (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');

-- Seguidores
select tests.throws($$insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b')$$,
  '23514', 'usuário não segue a si mesmo');
insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
select tests.throws($$insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')$$,
  '23505', 'follow duplicado é bloqueado');
select tests.throws($$insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')$$,
  '42501', 'usuário não cria follow em nome de outro');
reset role;

select tests.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
select tests.ok(tests.affected($$delete from public.comments where id = '20000000-0000-0000-0000-000000000001'$$) = 0,
  'usuário não exclui comentário alheio');
select tests.ok((select count(*) = 0 from public.post_saves), 'salvos de outros usuários são invisíveis');
select tests.ok((select count(distinct type) = 3 from public.notifications), 'notificações de curtida, comentário e seguidor foram criadas');
reset role;

select tests.as_user('00000000-0000-0000-0000-00000000000b');
set role authenticated;
select tests.ok((select count(*) = 0 from public.notifications), 'usuário não lê notificações de outro');

-- ---------------------------------------------------------------------------
-- Avaliações
-- ---------------------------------------------------------------------------
insert into public.reviews (id, place_id, user_id, rating, body)
select '30000000-0000-0000-0000-000000000001', id, auth.uid(), 4, 'Avaliação de teste do Beto.'
  from public.places where slug = 'pousada-mare-alta-demo-porto-seguro';
insert into public.review_category_scores (review_id, category_id, score)
select '30000000-0000-0000-0000-000000000001', id, 5 from public.review_categories where key = 'cleanliness';
select tests.throws($$insert into public.reviews (place_id, user_id, rating, body)
  select id, auth.uid(), 2, 'Segunda avaliação no mesmo lugar.' from public.places where slug = 'pousada-mare-alta-demo-porto-seguro'$$,
  '23505', 'só uma avaliação por usuário por lugar');
select tests.throws($$insert into public.reviews (place_id, user_id, rating, body)
  select id, auth.uid(), 6, 'Nota fora da escala permitida.' from public.places where slug = 'restaurante-casa-do-coco-demo-porto-seguro'$$,
  '23514', 'nota fora de 1 a 5 é rejeitada');
select tests.ok((select rating_avg = 4 and reviews_count = 1 from public.places where slug = 'pousada-mare-alta-demo-porto-seguro'),
  'nota média do lugar é atualizada');
reset role;

select tests.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
select tests.throws($$insert into public.review_category_scores (review_id, category_id, score)
  select '30000000-0000-0000-0000-000000000001', id, 1 from public.review_categories where key = 'service'$$,
  '42501', 'usuário não altera notas da avaliação de outro');
select tests.ok(tests.affected($$update public.places set rating_avg = 5$$) = 0, 'usuário não altera o catálogo de lugares');

-- ---------------------------------------------------------------------------
-- Roteiros
-- ---------------------------------------------------------------------------
select tests.ok(public.create_itinerary('{
  "title": "Roteiro público da Ana", "tags": ["praia"], "is_public": true,
  "days": [{"title": "Chegada", "places": [{"custom_name": "Praia", "start_time": "08:00"}, {"custom_name": "Almoço"}]},
           {"title": "Centro", "places": []}]
}'::jsonb) is not null, 'cria roteiro com dias e paradas');
select public.create_itinerary('{"title": "Roteiro privado da Ana", "is_public": false, "days": [{"title": "Dia único"}]}'::jsonb);
select tests.ok((select days_count = 2 from public.itineraries where title = 'Roteiro público da Ana'), 'quantidade de dias calculada');
select tests.ok((select count(*) = 2 from public.itinerary_places), 'paradas gravadas na ordem');
reset role;

select tests.as_user('00000000-0000-0000-0000-00000000000b');
set role authenticated;
select tests.ok((select count(*) = 1 from public.itineraries), 'roteiro privado é invisível para outros');
select tests.ok((select count(*) = 0 from public.itinerary_days d join public.itineraries i on i.id = d.itinerary_id where not i.is_public),
  'dias de roteiro privado são invisíveis');
select tests.ok(public.copy_itinerary((select id from public.itineraries where title = 'Roteiro público da Ana')) is not null,
  'usuário copia roteiro público');
select tests.ok((select count(*) = 2 from public.itinerary_places p join public.itinerary_days d on d.id = p.day_id
  join public.itineraries i on i.id = d.itinerary_id where i.user_id = auth.uid()), 'cópia inclui as paradas');
reset role;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
select set_config('tests.private_id', (select id::text from public.itineraries where title = 'Roteiro privado da Ana'), false);
set role authenticated;
select tests.throws(format('select public.copy_itinerary(%L)', current_setting('tests.private_id')),
  'P0002', 'usuário não copia roteiro privado');
select tests.ok(tests.affected($$update public.itineraries set title = 'invadido' where title = 'Roteiro público da Ana'$$) = 0,
  'usuário não edita roteiro alheio');

-- ---------------------------------------------------------------------------
-- Reclamações e estabelecimentos
-- ---------------------------------------------------------------------------
insert into public.complaints (id, place_id, user_id, category, title, description)
select '40000000-0000-0000-0000-000000000001', id, auth.uid(), 'billing', 'Cobrança em dobro', 'Fui cobrado duas vezes pela mesma diária no cartão.'
  from public.places where slug = 'pousada-mare-alta-demo-porto-seguro';
select tests.throws($$update public.complaints set status = 'answered' where id = '40000000-0000-0000-0000-000000000001'$$,
  '23514', 'autor não marca a própria reclamação como respondida');
select tests.ok(tests.affected($$update public.complaints set status = 'resolved' where id = '40000000-0000-0000-0000-000000000001'$$) = 1,
  'autor marca reclamação como resolvida');
select tests.throws($$update public.complaints set status = 'pending' where id = '40000000-0000-0000-0000-000000000001'$$,
  '23514', 'autor não reabre como pendente');
reset role;
update public.complaints set status = 'pending' where id = '40000000-0000-0000-0000-000000000001';

select tests.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
select tests.throws($$insert into public.business_profiles (owner_id, name, type, claim_status) values (auth.uid(), 'Pousada', 'hotel', 'verified')$$,
  '42501', 'usuário não se autoverifica como estabelecimento');
insert into public.business_profiles (id, owner_id, place_id, name, type)
select '50000000-0000-0000-0000-000000000001', auth.uid(), id, 'Pousada Maré Alta', 'hotel' from public.places where slug = 'pousada-mare-alta-demo-porto-seguro';
select tests.throws($$insert into public.complaint_responses (complaint_id, business_id, responder_id, body)
  values ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', auth.uid(), 'Resposta sem verificação')$$,
  '42501', 'estabelecimento não verificado não responde');
reset role;

update public.business_profiles set claim_status = 'verified', verified_at = now() where id = '50000000-0000-0000-0000-000000000001';
select tests.as_user('00000000-0000-0000-0000-00000000000a');
set role authenticated;
insert into public.complaint_responses (complaint_id, business_id, responder_id, body)
values ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', auth.uid(), 'Já estornamos a cobrança duplicada.');
select tests.ok((select status = 'answered' from public.complaints where id = '40000000-0000-0000-0000-000000000001'),
  'resposta do estabelecimento muda o status para respondida');
reset role;

-- ---------------------------------------------------------------------------
-- Denúncias, storage e busca
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000b');
set role authenticated;
insert into public.reports (reporter_id, target_type, target_id, reason) values (auth.uid(), 'post', '10000000-0000-0000-0000-000000000001', 'spam');
select tests.throws($$insert into public.reports (reporter_id, target_type, target_id, reason) values (auth.uid(), 'post', '10000000-0000-0000-0000-000000000001', 'fraud')$$,
  '23505', 'mesma denúncia não é registrada duas vezes');
insert into storage.objects (bucket_id, name) values ('photos', '00000000-0000-0000-0000-00000000000b/posts/foto.jpg');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('photos', '00000000-0000-0000-0000-00000000000a/posts/foto.jpg')$$,
  '42501', 'upload só na pasta do próprio usuário');
select tests.ok((public.search_all('florianopolis') -> 'destinations' -> 0 ->> 'name') = 'Florianópolis', 'busca ignora acentos');
select tests.ok(jsonb_array_length(public.search_all('roteiro') -> 'itineraries') = 2, 'busca não expõe roteiros privados de outros');
reset role;

\echo 'Todos os testes de banco passaram.'
