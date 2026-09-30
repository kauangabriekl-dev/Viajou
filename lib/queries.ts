import "server-only";
import type { ServerClient } from "@/lib/supabase/server";
import type {
  Comment,
  Complaint,
  Destination,
  DestinationWithStats,
  Itinerary,
  ItineraryDetail,
  Notification,
  Place,
  PlaceSummary,
  PlaceType,
  Post,
  PostDetail,
  Profile,
  ProfileSummary,
  Review,
  ReviewCategory,
  SearchResults,
} from "@/types/database";

/**
 * Leituras do banco. Todas usam o cliente do usuário (RLS aplicada).
 * Erros de banco sobem para o error.tsx da rota, que mostra mensagem amigável.
 */

const AUTHOR = "id, username, full_name, avatar_url";
export const POST_SELECT = `id, user_id, body, trip_start, trip_end, spent_cents, rating, tags, created_at,
  author:profiles!posts_user_id_fkey(${AUTHOR}),
  destination:destinations(slug, name, state),
  hotel:places!posts_hotel_place_id_fkey(slug, name),
  photos:post_photos(id, storage_path, alt, position),
  likes:post_likes(count),
  comments:comments(count)`;
const ITINERARY_SELECT = `id, user_id, title, description, days_count, tags, is_public, copied_from, created_at,
  author:profiles!itineraries_user_id_fkey(${AUTHOR}),
  destination:destinations(slug, name, state),
  likes:itinerary_likes(count)`;
const PLACE_SUMMARY =
  "id, slug, name, type, city, state, rating_avg, reviews_count, is_demo, image_url";
const REVIEW_SELECT = `id, place_id, user_id, rating, title, body, visited_on, created_at,
  author:profiles!reviews_user_id_fkey(${AUTHOR}),
  scores:review_category_scores(score, category:review_categories(key, label)),
  place:places(slug, name)`;
const COMPLAINT_SELECT = `id, place_id, user_id, category, title, description, status, created_at,
  author:profiles!complaints_user_id_fkey(${AUTHOR}),
  photos:complaint_photos(id, storage_path),
  responses:complaint_responses(id, body, created_at, business:business_profiles(name)),
  place:places(slug, name)`;

/** Listas: erro sobe para o error.tsx; ausência de dados vira lista vazia. */
function unwrap<T>(result: { data: T[] | null; error: unknown }, context: string): T[] {
  if (result.error) throw new Error(`Falha ao carregar ${context}`, { cause: result.error });
  return result.data ?? [];
}

/** Item único: null quando não existe (a página chama notFound()). */
function unwrapOne<T>(result: { data: T | null; error: unknown }, context: string): T | null {
  if (result.error) throw new Error(`Falha ao carregar ${context}`, { cause: result.error });
  return result.data;
}

const sortPhotos = <T extends { photos: { position: number }[] }>(item: T): T => ({
  ...item,
  photos: [...item.photos].sort((a, b) => a.position - b.position),
});

export const countOf = (rel: { count: number }[] | undefined) => rel?.[0]?.count ?? 0;

// ---------------------------------------------------------------------------
// Destinos e lugares
// ---------------------------------------------------------------------------

async function withStats(supabase: ServerClient, destinations: Destination[]) {
  if (!destinations.length) return [];
  const stats = unwrap(
    await supabase
      .from("destination_stats")
      .select("destination_id, reviews_count, rating_avg")
      .in(
        "destination_id",
        destinations.map((d) => d.id),
      )
      .overrideTypes<
        { destination_id: string; reviews_count: number; rating_avg: number }[],
        { merge: false }
      >(),
    "estatísticas",
  );
  return destinations.map((d) => {
    const s = stats.find((x) => x.destination_id === d.id);
    return { ...d, reviews_count: s?.reviews_count ?? 0, rating_avg: Number(s?.rating_avg ?? 0) };
  });
}

export async function listDestinations(
  supabase: ServerClient,
  limit = 50,
): Promise<DestinationWithStats[]> {
  const rows = unwrap(
    await supabase
      .from("destinations")
      .select("*")
      .order("name")
      .limit(limit)
      .overrideTypes<Destination[], { merge: false }>(),
    "destinos",
  );
  const enriched = await withStats(supabase, rows);
  return enriched.sort((a, b) => b.reviews_count - a.reviews_count || a.name.localeCompare(b.name));
}

export async function getDestination(supabase: ServerClient, slug: string) {
  const destination = unwrapOne(
    await supabase.from("destinations").select("*").eq("slug", slug).maybeSingle<Destination>(),
    "destino",
  );
  if (!destination) return null;
  const [stats] = await withStats(supabase, [destination]);
  return stats;
}

export async function listPlaces(
  supabase: ServerClient,
  filters: { destinationId?: string; type?: PlaceType; limit?: number; minReviews?: number } = {},
): Promise<PlaceSummary[]> {
  let query = supabase.from("places").select(PLACE_SUMMARY);
  if (filters.destinationId) query = query.eq("destination_id", filters.destinationId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.minReviews) query = query.gte("reviews_count", filters.minReviews);
  return unwrap(
    await query
      .order("rating_avg", { ascending: false })
      .order("reviews_count", { ascending: false })
      .order("name")
      .limit(filters.limit ?? 30)
      .overrideTypes<PlaceSummary[], { merge: false }>(),
    "lugares",
  );
}

export async function getPlace(supabase: ServerClient, slug: string) {
  return unwrapOne(
    await supabase
      .from("places")
      .select("*, destination:destinations(slug, name, state)")
      .eq("slug", slug)
      .maybeSingle<Place & { destination: Pick<Destination, "slug" | "name" | "state"> | null }>(),
    "lugar",
  );
}

export async function getReviewCategories(
  supabase: ServerClient,
  type: PlaceType,
): Promise<ReviewCategory[]> {
  const rows = unwrap(
    await supabase
      .from("place_categories")
      .select("position, category:review_categories(id, key, label)")
      .eq("place_type", type)
      .order("position")
      .overrideTypes<{ position: number; category: ReviewCategory }[], { merge: false }>(),
    "critérios",
  );
  return rows.map((r) => r.category);
}

/** Opções compactas para selects de formulário. */
export async function listDestinationOptions(supabase: ServerClient) {
  return unwrap(
    await supabase
      .from("destinations")
      .select("id, slug, name, state")
      .order("name")
      .overrideTypes<Pick<Destination, "id" | "slug" | "name" | "state">[], { merge: false }>(),
    "destinos",
  );
}

export async function listPlaceOptions(supabase: ServerClient) {
  return unwrap(
    await supabase
      .from("places")
      .select("id, name, type, destination_id")
      .order("name")
      .limit(500)
      .overrideTypes<Pick<Place, "id" | "name" | "type" | "destination_id">[], { merge: false }>(),
    "lugares",
  );
}

// ---------------------------------------------------------------------------
// Avaliações
// ---------------------------------------------------------------------------
export async function listReviews(
  supabase: ServerClient,
  filters: { placeId?: string; userId?: string; limit?: number },
): Promise<Review[]> {
  let query = supabase.from("reviews").select(REVIEW_SELECT);
  if (filters.placeId) query = query.eq("place_id", filters.placeId);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  return unwrap(
    await query
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 50)
      .overrideTypes<Review[], { merge: false }>(),
    "avaliações",
  );
}

export async function listDestinationReviewPhotos(
  supabase: ServerClient,
  destinationId: string,
  limit = 8,
) {
  return unwrap(
    await supabase
      .from("post_photos")
      .select("id, storage_path, alt, post:posts!inner(id, destination_id)")
      .eq("post.destination_id", destinationId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .overrideTypes<
        { id: string; storage_path: string; alt: string | null; post: { id: string } }[],
        { merge: false }
      >(),
    "fotos",
  );
}

// ---------------------------------------------------------------------------
// Publicações
// ---------------------------------------------------------------------------
export async function listPosts(
  supabase: ServerClient,
  filters: {
    userId?: string;
    userIds?: string[];
    destinationId?: string;
    ids?: string[];
    limit?: number;
  } = {},
): Promise<Post[]> {
  let query = supabase.from("posts").select(POST_SELECT);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.userIds) query = query.in("user_id", filters.userIds);
  if (filters.destinationId) query = query.eq("destination_id", filters.destinationId);
  if (filters.ids) query = query.in("id", filters.ids);
  const rows = unwrap(
    await query
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 20)
      .overrideTypes<Post[], { merge: false }>(),
    "publicações",
  );
  return rows.map(sortPhotos);
}

export async function listPostsByPlace(
  supabase: ServerClient,
  placeId: string,
  limit = 6,
): Promise<Post[]> {
  const links = unwrap(
    await supabase
      .from("post_places")
      .select("post_id")
      .eq("place_id", placeId)
      .limit(50)
      .overrideTypes<{ post_id: string }[], { merge: false }>(),
    "publicações",
  );
  const hotelPosts = unwrap(
    await supabase
      .from("posts")
      .select("id")
      .eq("hotel_place_id", placeId)
      .limit(50)
      .overrideTypes<{ id: string }[], { merge: false }>(),
    "publicações",
  );
  const ids = [...new Set([...links.map((l) => l.post_id), ...hotelPosts.map((p) => p.id)])];
  if (!ids.length) return [];
  return listPosts(supabase, { ids, limit });
}

export async function getPost(supabase: ServerClient, id: string): Promise<PostDetail | null> {
  const row = unwrapOne(
    await supabase
      .from("posts")
      .select(`${POST_SELECT}, places:post_places(place:places(slug, name, type))`)
      .eq("id", id)
      .maybeSingle<PostDetail>(),
    "publicação",
  );
  return row ? sortPhotos(row) : null;
}

export async function listComments(supabase: ServerClient, postId: string): Promise<Comment[]> {
  return unwrap(
    await supabase
      .from("comments")
      .select(
        `id, post_id, user_id, body, created_at, author:profiles!comments_user_id_fkey(${AUTHOR})`,
      )
      .eq("post_id", postId)
      .order("created_at")
      .limit(200)
      .overrideTypes<Comment[], { merge: false }>(),
    "comentários",
  );
}

// ---------------------------------------------------------------------------
// Roteiros
// ---------------------------------------------------------------------------
export async function listItineraries(
  supabase: ServerClient,
  filters: {
    userId?: string;
    destinationId?: string;
    ids?: string[];
    tags?: string[];
    limit?: number;
    publicOnly?: boolean;
  } = {},
): Promise<Itinerary[]> {
  let query = supabase.from("itineraries").select(ITINERARY_SELECT);
  // O RLS deixa o dono ver os próprios privados; listas de descoberta mostram só públicos.
  if (filters.publicOnly) query = query.eq("is_public", true);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.destinationId) query = query.eq("destination_id", filters.destinationId);
  if (filters.ids) query = query.in("id", filters.ids);
  if (filters.tags?.length) query = query.overlaps("tags", filters.tags);
  return unwrap(
    await query
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 24)
      .overrideTypes<Itinerary[], { merge: false }>(),
    "roteiros",
  );
}

export async function getItinerary(
  supabase: ServerClient,
  id: string,
): Promise<ItineraryDetail | null> {
  const row = unwrapOne(
    await supabase
      .from("itineraries")
      .select(
        `${ITINERARY_SELECT}, days:itinerary_days(id, day_number, title, description,
          stops:itinerary_places(id, custom_name, start_time, notes, position, place:places(slug, name, type)))`,
      )
      .eq("id", id)
      .maybeSingle<ItineraryDetail>(),
    "roteiro",
  );
  if (!row) return null;
  return {
    ...row,
    days: [...row.days]
      .sort((a, b) => a.day_number - b.day_number)
      .map((d) => ({ ...d, stops: [...d.stops].sort((a, b) => a.position - b.position) })),
  };
}

// ---------------------------------------------------------------------------
// Estado do usuário atual (curtiu? salvou? segue?)
// ---------------------------------------------------------------------------
export async function viewerPostState(
  supabase: ServerClient,
  userId: string | undefined,
  postIds: string[],
) {
  const empty = { liked: new Set<string>(), saved: new Set<string>() };
  if (!userId || !postIds.length) return empty;
  const [likes, saves] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", postIds),
    supabase.from("post_saves").select("post_id").eq("user_id", userId).in("post_id", postIds),
  ]);
  return {
    liked: new Set((likes.data ?? []).map((r: { post_id: string }) => r.post_id)),
    saved: new Set((saves.data ?? []).map((r: { post_id: string }) => r.post_id)),
  };
}

export async function viewerItineraryState(
  supabase: ServerClient,
  userId: string | undefined,
  id: string,
) {
  if (!userId) return { liked: false, saved: false };
  const [like, save] = await Promise.all([
    supabase
      .from("itinerary_likes")
      .select("itinerary_id")
      .eq("user_id", userId)
      .eq("itinerary_id", id)
      .maybeSingle(),
    supabase
      .from("itinerary_saves")
      .select("itinerary_id")
      .eq("user_id", userId)
      .eq("itinerary_id", id)
      .maybeSingle(),
  ]);
  return { liked: Boolean(like.data), saved: Boolean(save.data) };
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------
export async function getProfileByUsername(supabase: ServerClient, username: string) {
  return unwrapOne(
    await supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url, created_at")
      .eq("username", username.toLowerCase())
      .maybeSingle<Profile>(),
    "perfil",
  );
}

export async function getProfileStats(supabase: ServerClient, userId: string) {
  const head = { count: "exact" as const, head: true };
  const [posts, reviews, itineraries, followers, following] = await Promise.all([
    supabase.from("posts").select("id", head).eq("user_id", userId),
    supabase.from("reviews").select("id", head).eq("user_id", userId),
    supabase.from("itineraries").select("id", head).eq("user_id", userId),
    supabase.from("follows").select("follower_id", head).eq("following_id", userId),
    supabase.from("follows").select("following_id", head).eq("follower_id", userId),
  ]);
  return {
    posts: posts.count ?? 0,
    reviews: reviews.count ?? 0,
    itineraries: itineraries.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

export async function isFollowing(
  supabase: ServerClient,
  followerId: string | undefined,
  followingId: string,
) {
  if (!followerId || followerId === followingId) return false;
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function listFollowingIds(supabase: ServerClient, userId: string): Promise<string[]> {
  const rows = unwrap(
    await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .limit(500)
      .overrideTypes<{ following_id: string }[], { merge: false }>(),
    "seguindo",
  );
  return rows.map((r) => r.following_id);
}

export async function listUserPhotos(supabase: ServerClient, userId: string, limit = 30) {
  return unwrap(
    await supabase
      .from("post_photos")
      .select("id, storage_path, alt, post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .overrideTypes<
        { id: string; storage_path: string; alt: string | null; post_id: string }[],
        { merge: false }
      >(),
    "fotos",
  );
}

// ---------------------------------------------------------------------------
// Reclamações
// ---------------------------------------------------------------------------
export async function listComplaints(
  supabase: ServerClient,
  filters: { placeId?: string; userId?: string; limit?: number },
): Promise<Complaint[]> {
  let query = supabase.from("complaints").select(COMPLAINT_SELECT);
  if (filters.placeId) query = query.eq("place_id", filters.placeId);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  return unwrap(
    await query
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 30)
      .overrideTypes<Complaint[], { merge: false }>(),
    "reclamações",
  );
}

// ---------------------------------------------------------------------------
// Área privada
// ---------------------------------------------------------------------------
export async function listSavedPostIds(supabase: ServerClient, userId: string) {
  const rows = unwrap(
    await supabase
      .from("post_saves")
      .select("post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)
      .overrideTypes<{ post_id: string }[], { merge: false }>(),
    "salvos",
  );
  return rows.map((r) => r.post_id);
}

export async function listSavedItineraryIds(supabase: ServerClient, userId: string) {
  const rows = unwrap(
    await supabase
      .from("itinerary_saves")
      .select("itinerary_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)
      .overrideTypes<{ itinerary_id: string }[], { merge: false }>(),
    "salvos",
  );
  return rows.map((r) => r.itinerary_id);
}

export async function listNotifications(
  supabase: ServerClient,
  userId: string,
): Promise<Notification[]> {
  return unwrap(
    await supabase
      .from("notifications")
      .select(
        `id, type, read_at, created_at, post_id, itinerary_id, complaint_id, actor:profiles!notifications_actor_id_fkey(${AUTHOR})`,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .overrideTypes<Notification[], { merge: false }>(),
    "notificações",
  );
}

export async function countUnreadNotifications(supabase: ServerClient, userId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export type TripPlanRow = {
  id: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget_cents: number | null;
  preferences: string[];
  destination: Pick<Destination, "id" | "slug" | "name" | "state">;
};

export async function listTripPlans(
  supabase: ServerClient,
  userId: string,
): Promise<TripPlanRow[]> {
  return unwrap(
    await supabase
      .from("trip_plans")
      .select(
        "id, start_date, end_date, travelers, budget_cents, preferences, destination:destinations(id, slug, name, state)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .overrideTypes<TripPlanRow[], { merge: false }>(),
    "planos",
  );
}

export async function getTripPlan(supabase: ServerClient, id: string): Promise<TripPlanRow | null> {
  return unwrapOne(
    await supabase
      .from("trip_plans")
      .select(
        "id, start_date, end_date, travelers, budget_cents, preferences, destination:destinations(id, slug, name, state)",
      )
      .eq("id", id)
      .maybeSingle<TripPlanRow>(),
    "plano",
  );
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------
export async function searchAll(supabase: ServerClient, q: string): Promise<SearchResults> {
  const { data, error } = await supabase.rpc("search_all", { q, max_per_group: 8 });
  if (error) throw new Error("Falha na busca", { cause: error });
  return data as SearchResults;
}

export type { ProfileSummary };
