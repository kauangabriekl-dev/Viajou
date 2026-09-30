-- ============================================================================
-- VIAJOU — Schema principal
-- Tabelas, tipos, constraints, índices e triggers de integridade.
-- RLS está em 20260929000002_rls.sql; storage em 20260929000003_storage.sql.
-- ============================================================================

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.place_type as enum ('hotel', 'restaurant', 'beach', 'attraction', 'tour', 'other');
create type public.complaint_category as enum ('billing', 'customer_service', 'reservation', 'service', 'cleanliness', 'advertising', 'other');
create type public.complaint_status as enum ('pending', 'answered', 'resolved', 'closed');
create type public.report_target as enum ('post', 'comment', 'review', 'profile', 'photo');
create type public.report_reason as enum ('spam', 'offensive', 'false_information', 'fraud', 'inappropriate', 'other');
create type public.report_status as enum ('open', 'reviewing', 'closed');
create type public.notification_type as enum ('follow', 'post_like', 'comment', 'comment_reply', 'itinerary_saved', 'business_response');
create type public.business_type as enum ('hotel', 'restaurant', 'agency', 'tour', 'attraction');
create type public.business_claim_status as enum ('pending', 'verified', 'rejected');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Versão imutável de unaccent para busca sem acento ("florianopolis" encontra "Florianópolis").
create or replace function public.normalize_text(value text) returns text
language sql immutable parallel safe
set search_path = public, extensions
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''))) $$;

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name text not null check (char_length(full_name) between 1 and 80),
  bio text check (char_length(bio) <= 300),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente no cadastro. Username vem do metadata do signUp.
-- Se o username já existir, o cadastro inteiro falha (atomicidade).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta_username text := lower(nullif(new.raw_user_meta_data ->> 'username', ''));
  meta_name text := nullif(new.raw_user_meta_data ->> 'full_name', '');
begin
  if meta_username is null then
    -- OAuth (ex.: Google) não envia username: gera um provisório e único.
    meta_username := left(regexp_replace(lower(split_part(coalesce(new.email, 'viajante'), '@', 1)), '[^a-z0-9_]', '', 'g'), 20)
      || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
    if char_length(meta_username) < 3 then
      meta_username := 'viajante_' || substr(replace(new.id::text, '-', ''), 1, 8);
    end if;
  end if;

  insert into public.profiles (id, username, full_name)
  values (new.id, meta_username, coalesce(meta_name, meta_username));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Destinos e lugares
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  city text not null,
  state text not null,
  country text not null default 'Brasil',
  description text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  cover_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  type public.place_type not null,
  description text,
  address text,
  city text,
  state text,
  country text default 'Brasil',
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  image_url text,
  website text,
  phone text,
  rating_avg numeric(3, 2) not null default 0,
  reviews_count integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index places_destination_idx on public.places (destination_id, type);
create index places_rating_idx on public.places (rating_avg desc, reviews_count desc);

-- Critérios de avaliação (Atendimento, Limpeza, Comida...)
create table public.review_categories (
  id smallint generated always as identity primary key,
  key text not null unique,
  label text not null
);

-- Quais critérios valem para cada tipo de lugar (estrutura flexível).
create table public.place_categories (
  place_type public.place_type not null,
  review_category_id smallint not null references public.review_categories (id) on delete cascade,
  position smallint not null default 0,
  primary key (place_type, review_category_id)
);

-- ---------------------------------------------------------------------------
-- Avaliações (uma por usuário por lugar)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (char_length(title) <= 120),
  body text not null check (char_length(body) between 10 and 3000),
  visited_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id)
);
create index reviews_place_idx on public.reviews (place_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id, created_at desc);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_category_scores (
  review_id uuid not null references public.reviews (id) on delete cascade,
  category_id smallint not null references public.review_categories (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  primary key (review_id, category_id)
);

-- Mantém nota média e total de avaliações do lugar.
create or replace function public.refresh_place_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.place_id, old.place_id);
begin
  update public.places p
     set rating_avg = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.place_id = target), 0),
         reviews_count = (select count(*) from public.reviews r where r.place_id = target)
   where p.id = target;
  return null;
end $$;

create trigger reviews_refresh_rating after insert or update of rating or delete on public.reviews
  for each row execute function public.refresh_place_rating();

-- Nota agregada por destino
create view public.destination_stats with (security_invoker = true) as
select d.id as destination_id,
       count(r.id)::int as reviews_count,
       coalesce(round(avg(r.rating)::numeric, 2), 0) as rating_avg
  from public.destinations d
  left join public.places p on p.destination_id = d.id
  left join public.reviews r on r.place_id = p.id
 group by d.id;

-- ---------------------------------------------------------------------------
-- Publicações (experiências de viagem)
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  destination_id uuid references public.destinations (id) on delete set null,
  hotel_place_id uuid references public.places (id) on delete set null,
  body text not null check (char_length(body) between 10 and 5000),
  trip_start date,
  trip_end date,
  spent_cents integer check (spent_cents >= 0),
  rating smallint check (rating between 1 and 5),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trip_end is null or trip_start is null or trip_end >= trip_start)
);
create index posts_feed_idx on public.posts (created_at desc);
create index posts_user_idx on public.posts (user_id, created_at desc);
create index posts_destination_idx on public.posts (destination_id, created_at desc);
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- Lugares visitados na viagem
create table public.post_places (
  post_id uuid not null references public.posts (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  primary key (post_id, place_id)
);
create index post_places_place_idx on public.post_places (place_id);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  alt text check (char_length(alt) <= 200),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index post_photos_post_idx on public.post_photos (post_id, position);

-- Limite de fotos por publicação
create or replace function public.enforce_post_photo_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.post_photos where post_id = new.post_id) >= 10 then
    raise exception 'Limite de 10 fotos por publicação' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger post_photos_limit before insert on public.post_photos
  for each row execute function public.enforce_post_photo_limit();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_saves_user_idx on public.post_saves (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Seguidores
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Roteiros
-- ---------------------------------------------------------------------------
create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  destination_id uuid references public.destinations (id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 2000),
  days_count smallint not null check (days_count between 1 and 30),
  tags text[] not null default '{}',
  is_public boolean not null default true,
  copied_from uuid references public.itineraries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index itineraries_public_idx on public.itineraries (is_public, created_at desc);
create index itineraries_destination_idx on public.itineraries (destination_id);
create index itineraries_tags_idx on public.itineraries using gin (tags);
create trigger itineraries_updated_at before update on public.itineraries
  for each row execute function public.set_updated_at();

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries (id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 30),
  title text check (char_length(title) <= 120),
  description text check (char_length(description) <= 1000),
  unique (itinerary_id, day_number)
);

create table public.itinerary_places (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.itinerary_days (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  custom_name text check (char_length(custom_name) <= 120),
  start_time time,
  notes text check (char_length(notes) <= 500),
  position smallint not null default 0,
  check (place_id is not null or custom_name is not null)
);
create index itinerary_places_day_idx on public.itinerary_places (day_id, position);

create table public.itinerary_likes (
  itinerary_id uuid not null references public.itineraries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (itinerary_id, user_id)
);

create table public.itinerary_saves (
  itinerary_id uuid not null references public.itineraries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (itinerary_id, user_id)
);
create index itinerary_saves_user_idx on public.itinerary_saves (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Estabelecimentos (estrutura para o futuro)
-- ---------------------------------------------------------------------------
create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid unique references public.places (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  type public.business_type not null,
  claim_status public.business_claim_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reclamações
-- ---------------------------------------------------------------------------
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.complaint_category not null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 4000),
  status public.complaint_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index complaints_place_idx on public.complaints (place_id, created_at desc);
create index complaints_user_idx on public.complaints (user_id, created_at desc);
create trigger complaints_updated_at before update on public.complaints
  for each row execute function public.set_updated_at();

create table public.complaint_photos (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table public.complaint_responses (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  responder_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 5 and 4000),
  created_at timestamptz not null default now()
);

-- Resposta do estabelecimento muda o status para "answered".
create or replace function public.mark_complaint_answered() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.complaints set status = 'answered'
   where id = new.complaint_id and status = 'pending';
  return new;
end $$;
create trigger complaint_responses_answered after insert on public.complaint_responses
  for each row execute function public.mark_complaint_answered();

-- Autor da reclamação pode marcar como resolvida/encerrada, mas não "answered".
create or replace function public.guard_complaint_status() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
     and current_user in ('authenticated', 'anon')
     and new.status not in ('resolved', 'closed') then
    raise exception 'Status inválido' using errcode = 'check_violation';
  end if;
  if new.place_id <> old.place_id or new.user_id <> old.user_id then
    raise exception 'Campos imutáveis' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger complaints_guard_status before update on public.complaints
  for each row execute function public.guard_complaint_status();

-- ---------------------------------------------------------------------------
-- Planejamento "Vou viajar"
-- ---------------------------------------------------------------------------
create table public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  travelers smallint not null check (travelers between 1 and 50),
  budget_cents integer check (budget_cents >= 0),
  preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index trip_plans_user_idx on public.trip_plans (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  itinerary_id uuid references public.itineraries (id) on delete cascade,
  complaint_id uuid references public.complaints (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notify(
  recipient uuid, actor uuid, kind public.notification_type,
  p_post uuid default null, p_comment uuid default null,
  p_itinerary uuid default null, p_complaint uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if recipient is null or recipient = actor then return; end if;
  insert into public.notifications (user_id, actor_id, type, post_id, comment_id, itinerary_id, complaint_id)
  values (recipient, actor, kind, p_post, p_comment, p_itinerary, p_complaint);
end $$;
revoke execute on function public.notify from public, anon, authenticated;

create or replace function public.on_follow_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.following_id, new.follower_id, 'follow');
  return new;
end $$;
create trigger follows_notify after insert on public.follows
  for each row execute function public.on_follow_notify();

create or replace function public.on_post_like_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'post_like', new.post_id);
  return new;
end $$;
create trigger post_likes_notify after insert on public.post_likes
  for each row execute function public.on_post_like_notify();

create or replace function public.on_comment_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.parent_id is not null then
    perform public.notify((select user_id from public.comments where id = new.parent_id), new.user_id, 'comment_reply', new.post_id, new.id);
  end if;
  perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'comment', new.post_id, new.id);
  return new;
end $$;
create trigger comments_notify after insert on public.comments
  for each row execute function public.on_comment_notify();

create or replace function public.on_itinerary_save_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select user_id from public.itineraries where id = new.itinerary_id), new.user_id, 'itinerary_saved', null, null, new.itinerary_id);
  return new;
end $$;
create trigger itinerary_saves_notify after insert on public.itinerary_saves
  for each row execute function public.on_itinerary_save_notify();

create or replace function public.on_complaint_response_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select user_id from public.complaints where id = new.complaint_id), new.responder_id, 'business_response', null, null, null, new.complaint_id);
  return new;
end $$;
create trigger complaint_responses_notify after insert on public.complaint_responses
  for each row execute function public.on_complaint_response_notify();

-- ---------------------------------------------------------------------------
-- Denúncias (moderação)
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- ---------------------------------------------------------------------------
-- Funções de aplicação (SECURITY INVOKER: respeitam RLS)
-- ---------------------------------------------------------------------------

-- Cria roteiro com dias e paradas numa única transação.
-- payload: { title, description, destination_id, tags[], is_public,
--            days: [{ title, description, places: [{ place_id, custom_name, start_time, notes }] }] }
create or replace function public.create_itinerary(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  new_id uuid;
  day jsonb;
  stop jsonb;
  day_id uuid;
  day_idx int := 0;
  stop_idx int;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  insert into public.itineraries (user_id, destination_id, title, description, days_count, tags, is_public)
  values (
    auth.uid(),
    nullif(payload ->> 'destination_id', '')::uuid,
    payload ->> 'title',
    nullif(payload ->> 'description', ''),
    jsonb_array_length(payload -> 'days'),
    coalesce(array(select jsonb_array_elements_text(payload -> 'tags')), '{}'),
    coalesce((payload ->> 'is_public')::boolean, true)
  ) returning id into new_id;

  for day in select * from jsonb_array_elements(payload -> 'days') loop
    day_idx := day_idx + 1;
    insert into public.itinerary_days (itinerary_id, day_number, title, description)
    values (new_id, day_idx, nullif(day ->> 'title', ''), nullif(day ->> 'description', ''))
    returning id into day_id;

    stop_idx := 0;
    for stop in select * from jsonb_array_elements(coalesce(day -> 'places', '[]'::jsonb)) loop
      insert into public.itinerary_places (day_id, place_id, custom_name, start_time, notes, position)
      values (
        day_id,
        nullif(stop ->> 'place_id', '')::uuid,
        nullif(stop ->> 'custom_name', ''),
        nullif(stop ->> 'start_time', '')::time,
        nullif(stop ->> 'notes', ''),
        stop_idx
      );
      stop_idx := stop_idx + 1;
    end loop;
  end loop;

  return new_id;
end $$;

-- Copia um roteiro visível para a conta do usuário atual.
create or replace function public.copy_itinerary(source_id uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  src public.itineraries;
  new_id uuid;
  d public.itinerary_days;
  new_day uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;

  select * into src from public.itineraries where id = source_id; -- RLS filtra roteiros privados
  if not found then
    raise exception 'Roteiro não encontrado' using errcode = 'P0002';
  end if;

  insert into public.itineraries (user_id, destination_id, title, description, days_count, tags, is_public, copied_from)
  values (auth.uid(), src.destination_id, left('Cópia de ' || src.title, 120), src.description, src.days_count, src.tags, false, src.id)
  returning id into new_id;

  for d in select * from public.itinerary_days where itinerary_id = src.id order by day_number loop
    insert into public.itinerary_days (itinerary_id, day_number, title, description)
    values (new_id, d.day_number, d.title, d.description) returning id into new_day;

    insert into public.itinerary_places (day_id, place_id, custom_name, start_time, notes, position)
    select new_day, place_id, custom_name, start_time, notes, position
      from public.itinerary_places where day_id = d.id;
  end loop;

  return new_id;
end $$;

-- Busca global agrupada, sem diferenciar acentos e maiúsculas.
create or replace function public.search_all(q text, max_per_group int default 5) returns jsonb
language sql stable security invoker set search_path = public as $$
  with term as (select '%' || public.normalize_text(trim(q)) || '%' as t)
  select jsonb_build_object(
    'destinations', coalesce((
      select jsonb_agg(x) from (
        select d.id, d.slug, d.name, d.state, d.country from public.destinations d, term
         where public.normalize_text(d.name || ' ' || d.city || ' ' || d.state) like term.t
         order by d.name limit max_per_group) x), '[]'::jsonb),
    'places', coalesce((
      select jsonb_agg(x) from (
        select p.id, p.slug, p.name, p.type, p.city, p.state, p.rating_avg, p.reviews_count, p.is_demo from public.places p, term
         where public.normalize_text(p.name || ' ' || coalesce(p.city, '')) like term.t
         order by p.reviews_count desc, p.name limit max_per_group) x), '[]'::jsonb),
    'profiles', coalesce((
      select jsonb_agg(x) from (
        select pr.id, pr.username, pr.full_name, pr.avatar_url from public.profiles pr, term
         where public.normalize_text(pr.username || ' ' || pr.full_name) like term.t
         order by pr.username limit max_per_group) x), '[]'::jsonb),
    'itineraries', coalesce((
      select jsonb_agg(x) from (
        select i.id, i.title, i.days_count from public.itineraries i, term
         where public.normalize_text(i.title || ' ' || coalesce(i.description, '')) like term.t
         order by i.created_at desc limit max_per_group) x), '[]'::jsonb)
  )
$$;
