-- ============================================================================
-- VIAJOU — Row Level Security
-- Regra geral: leitura pública só onde faz sentido; escrita só do próprio dono.
-- Tabelas de catálogo (destinos, lugares, critérios) só são escritas via service role.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.places enable row level security;
alter table public.review_categories enable row level security;
alter table public.place_categories enable row level security;
alter table public.reviews enable row level security;
alter table public.review_category_scores enable row level security;
alter table public.posts enable row level security;
alter table public.post_places enable row level security;
alter table public.post_photos enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.follows enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_places enable row level security;
alter table public.itinerary_likes enable row level security;
alter table public.itinerary_saves enable row level security;
alter table public.business_profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_photos enable row level security;
alter table public.complaint_responses enable row level security;
alter table public.trip_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Perfis --------------------------------------------------------------------
create policy "Perfis são públicos" on public.profiles for select using (true);
create policy "Usuário edita o próprio perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Insert apenas pelo trigger handle_new_user (security definer).

-- Catálogo (somente leitura para usuários) -----------------------------------
create policy "Destinos são públicos" on public.destinations for select using (true);
create policy "Lugares são públicos" on public.places for select using (true);
create policy "Critérios são públicos" on public.review_categories for select using (true);
create policy "Critérios por tipo são públicos" on public.place_categories for select using (true);

-- Avaliações ----------------------------------------------------------------
create policy "Avaliações são públicas" on public.reviews for select using (true);
create policy "Autenticado cria avaliação própria" on public.reviews for insert to authenticated
  with check (user_id = auth.uid());
create policy "Autor edita avaliação" on public.reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Autor exclui avaliação" on public.reviews for delete to authenticated
  using (user_id = auth.uid());

create policy "Notas por critério são públicas" on public.review_category_scores for select using (true);
create policy "Autor da avaliação grava notas" on public.review_category_scores for insert to authenticated
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "Autor da avaliação altera notas" on public.review_category_scores for update to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "Autor da avaliação remove notas" on public.review_category_scores for delete to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));

-- Publicações ---------------------------------------------------------------
create policy "Publicações são públicas" on public.posts for select using (true);
create policy "Autenticado cria publicação própria" on public.posts for insert to authenticated
  with check (user_id = auth.uid());
create policy "Autor edita publicação" on public.posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Autor exclui publicação" on public.posts for delete to authenticated
  using (user_id = auth.uid());

create policy "Lugares da publicação são públicos" on public.post_places for select using (true);
create policy "Autor vincula lugares" on public.post_places for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "Autor desvincula lugares" on public.post_places for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

create policy "Fotos são públicas" on public.post_photos for select using (true);
create policy "Autor adiciona fotos" on public.post_photos for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
    and storage_path like auth.uid()::text || '/%'
  );
create policy "Autor remove fotos" on public.post_photos for delete to authenticated
  using (user_id = auth.uid());

-- Comentários ---------------------------------------------------------------
create policy "Comentários são públicos" on public.comments for select using (true);
create policy "Autenticado comenta como si mesmo" on public.comments for insert to authenticated
  with check (user_id = auth.uid());
create policy "Autor exclui comentário" on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- Curtidas e salvos ---------------------------------------------------------
create policy "Curtidas são públicas" on public.post_likes for select using (true);
create policy "Usuário curte como si mesmo" on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy "Usuário descurte" on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

create policy "Salvos são privados" on public.post_saves for select to authenticated
  using (user_id = auth.uid());
create policy "Usuário salva" on public.post_saves for insert to authenticated
  with check (user_id = auth.uid());
create policy "Usuário remove salvo" on public.post_saves for delete to authenticated
  using (user_id = auth.uid());

-- Seguidores ----------------------------------------------------------------
create policy "Seguidores são públicos" on public.follows for select using (true);
create policy "Usuário segue como si mesmo" on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy "Usuário deixa de seguir" on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- Roteiros ------------------------------------------------------------------
create policy "Roteiros públicos ou próprios" on public.itineraries for select
  using (is_public or user_id = auth.uid());
create policy "Autenticado cria roteiro próprio" on public.itineraries for insert to authenticated
  with check (user_id = auth.uid());
create policy "Autor edita roteiro" on public.itineraries for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Autor exclui roteiro" on public.itineraries for delete to authenticated
  using (user_id = auth.uid());

create policy "Dias visíveis com o roteiro" on public.itinerary_days for select
  using (exists (select 1 from public.itineraries i where i.id = itinerary_id and (i.is_public or i.user_id = auth.uid())));
create policy "Autor gerencia dias" on public.itinerary_days for all to authenticated
  using (exists (select 1 from public.itineraries i where i.id = itinerary_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.itineraries i where i.id = itinerary_id and i.user_id = auth.uid()));

create policy "Paradas visíveis com o roteiro" on public.itinerary_places for select
  using (exists (
    select 1 from public.itinerary_days d join public.itineraries i on i.id = d.itinerary_id
     where d.id = day_id and (i.is_public or i.user_id = auth.uid())));
create policy "Autor gerencia paradas" on public.itinerary_places for all to authenticated
  using (exists (
    select 1 from public.itinerary_days d join public.itineraries i on i.id = d.itinerary_id
     where d.id = day_id and i.user_id = auth.uid()))
  with check (exists (
    select 1 from public.itinerary_days d join public.itineraries i on i.id = d.itinerary_id
     where d.id = day_id and i.user_id = auth.uid()));

create policy "Curtidas de roteiro são públicas" on public.itinerary_likes for select using (true);
create policy "Usuário curte roteiro" on public.itinerary_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy "Usuário descurte roteiro" on public.itinerary_likes for delete to authenticated
  using (user_id = auth.uid());

create policy "Roteiros salvos são privados" on public.itinerary_saves for select to authenticated
  using (user_id = auth.uid());
create policy "Usuário salva roteiro" on public.itinerary_saves for insert to authenticated
  with check (user_id = auth.uid());
create policy "Usuário remove roteiro salvo" on public.itinerary_saves for delete to authenticated
  using (user_id = auth.uid());

-- Estabelecimentos ----------------------------------------------------------
create policy "Estabelecimentos são públicos" on public.business_profiles for select using (true);
create policy "Usuário solicita reivindicação" on public.business_profiles for insert to authenticated
  with check (owner_id = auth.uid() and claim_status = 'pending' and verified_at is null);
-- Verificação e edição ficam com a moderação (service role) no MVP.

-- Reclamações ---------------------------------------------------------------
create policy "Reclamações são públicas" on public.complaints for select using (true);
create policy "Autenticado registra reclamação" on public.complaints for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "Autor atualiza reclamação" on public.complaints for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Autor exclui reclamação" on public.complaints for delete to authenticated
  using (user_id = auth.uid());

create policy "Fotos de reclamação são públicas" on public.complaint_photos for select using (true);
create policy "Autor anexa fotos" on public.complaint_photos for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.complaints c where c.id = complaint_id and c.user_id = auth.uid())
    and storage_path like auth.uid()::text || '/%'
  );

create policy "Respostas são públicas" on public.complaint_responses for select using (true);
create policy "Estabelecimento verificado responde" on public.complaint_responses for insert to authenticated
  with check (
    responder_id = auth.uid()
    and exists (
      select 1 from public.business_profiles b
        join public.complaints c on c.place_id = b.place_id
       where b.id = business_id and b.owner_id = auth.uid()
         and b.claim_status = 'verified' and c.id = complaint_id)
  );

-- Planos de viagem, notificações e denúncias: sempre privados -----------------
create policy "Planos são privados" on public.trip_plans for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Usuário vê suas notificações" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "Usuário marca notificação como lida" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Usuário vê suas denúncias" on public.reports for select to authenticated
  using (reporter_id = auth.uid());
create policy "Usuário denuncia" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
