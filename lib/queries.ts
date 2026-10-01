import "server-only";
import { inList, one, rows } from "@/lib/db/client";
import { normalizePlace } from "@/lib/geo-search";
import { destinationStyleValues } from "@/lib/labels";
import type { Candidate } from "@/lib/suggested-itinerary";
import type {
  Achado,
  Comment,
  Complaint,
  Destination,
  DestinationInsights,
  DestinationStyle,
  DestinationReview,
  DestinationTip,
  DestinationWithStats,
  Itinerary,
  ItineraryDay,
  ItineraryDetail,
  Notification,
  Place,
  PlaceSummary,
  PlaceType,
  Post,
  PostDetail,
  PostPhoto,
  Profile,
  ProfileSummary,
  Review,
  ReviewCategory,
  SearchResults,
} from "@/types/database";

/**
 * Leituras do banco H2. Cada função devolve o mesmo formato de antes (types/database.ts):
 * as páginas e os componentes não mudam. Dados relacionados (autor, destino, fotos, contagens)
 * vêm de consultas em lote por id, montadas aqui, sem uma consulta por item.
 *
 * Privacidade que antes era do RLS agora é explícita: roteiros privados só para o dono
 * (`viewerId`); salvos, notificações e planos sempre filtrados pelo próprio usuário.
 */

/** Usuário que está vendo a página (null = visitante). */
type Viewer = string | null | undefined;

const lim = (n: number | undefined, fallback: number) =>
  Math.max(1, Math.min(500, Math.trunc(n ?? fallback)));
const uniq = <T>(values: (T | null | undefined)[]) => [
  ...new Set(values.filter((v): v is T => v != null)),
];

export const countOf = (rel: { count: number }[] | undefined) => rel?.[0]?.count ?? 0;

// ---------------------------------------------------------------------------
// Blocos reutilizados
// ---------------------------------------------------------------------------
async function authorsById(ids: string[]) {
  const list = inList(uniq(ids), 1);
  const found = await rows<ProfileSummary>(
    `SELECT id, username, full_name, avatar_url FROM profiles WHERE id ${list.sql}`,
    list.params,
  );
  return new Map(found.map((a) => [a.id, a]));
}

async function countsBy(table: string, column: string, ids: string[]) {
  const list = inList(uniq(ids), 1);
  const found = await rows<{ id: string; n: number }>(
    `SELECT ${column} AS id, COUNT(*) AS n FROM ${table} WHERE ${column} ${list.sql} GROUP BY ${column}`,
    list.params,
  );
  return new Map(found.map((r) => [r.id, Number(r.n)]));
}

type DestinationBrief = Pick<Destination, "id" | "slug" | "name" | "state">;
async function destinationsById(ids: (string | null)[]) {
  const list = inList(uniq(ids), 1);
  const found = await rows<DestinationBrief>(
    `SELECT id, slug, name, state FROM destinations WHERE id ${list.sql}`,
    list.params,
  );
  return new Map(found.map((d) => [d.id, d]));
}

type PlaceBrief = Pick<Place, "id" | "slug" | "name" | "type">;
async function placesById(ids: (string | null)[]) {
  const list = inList(uniq(ids), 1);
  const found = await rows<PlaceBrief>(
    `SELECT id, slug, name, type FROM places WHERE id ${list.sql}`,
    list.params,
  );
  return new Map(found.map((p) => [p.id, p]));
}

const brief = <T extends { slug: string; name: string }>(item: T | undefined) =>
  item ? { slug: item.slug, name: item.name } : null;

const DESTINATION_COLUMNS =
  "d.id, d.slug, d.name, d.city, d.state, d.country, d.description, d.latitude, d.longitude, d.cover_url, d.is_demo";
const PLACE_SUMMARY =
  "id, slug, name, type, city, state, rating_avg, reviews_count, is_demo, image_url";

// ---------------------------------------------------------------------------
// Destinos e lugares
// ---------------------------------------------------------------------------
/** Achadinho de trilha, cachoeira ou praia também marca o estilo do destino. */
const ACHADO_STYLE: Partial<Record<string, DestinationStyle>> = {
  trilha: "trilha",
  cachoeira: "cachoeira",
  praia: "praia",
};

/**
 * Estilos de cada destino, combinando: catálogo (destination_styles), votos "bom para"
 * de quem avaliou o destino, lugares de praia e achadinhos (trilha, cachoeira, praia).
 */
async function stylesFor(destinationIds: string[]): Promise<Map<string, DestinationStyle[]>> {
  const ids = inList(destinationIds, 1);
  const [explicit, votes, beaches, achados] = await Promise.all([
    rows<{ destination_id: string; style: string }>(
      `SELECT destination_id, style FROM destination_styles WHERE destination_id ${ids.sql}`,
      ids.params,
    ),
    rows<{ destination_id: string; styles: string }>(
      `SELECT destination_id, styles FROM destination_reviews
        WHERE styles IS NOT NULL AND destination_id ${ids.sql}`,
      ids.params,
    ),
    rows<{ destination_id: string }>(
      `SELECT DISTINCT destination_id FROM places WHERE type = 'beach' AND destination_id ${ids.sql}`,
      ids.params,
    ),
    rows<{ destination_id: string; category: string }>(
      `SELECT DISTINCT destination_id, category FROM achados WHERE destination_id ${ids.sql}`,
      ids.params,
    ),
  ]);
  const found = new Map<string, Set<string>>();
  const add = (id: string, style: string | undefined) => {
    if (!style) return;
    if (!found.has(id)) found.set(id, new Set());
    found.get(id)!.add(style);
  };
  for (const e of explicit) add(e.destination_id, e.style);
  for (const v of votes) for (const style of v.styles.split(",")) add(v.destination_id, style);
  for (const b of beaches) add(b.destination_id, "praia");
  for (const a of achados) add(a.destination_id, ACHADO_STYLE[a.category]);
  // Só estilos conhecidos, na ordem dos chips.
  return new Map(
    [...found].map(([id, set]) => [id, destinationStyleValues.filter((v) => set.has(v))]),
  );
}

export async function listDestinations(
  limit = 50,
  style?: DestinationStyle,
): Promise<DestinationWithStats[]> {
  const found = await rows<DestinationWithStats>(
    `SELECT ${DESTINATION_COLUMNS}, COALESCE(s.reviews_count, 0) AS reviews_count, COALESCE(s.rating_avg, 0) AS rating_avg
       FROM destinations d LEFT JOIN destination_stats s ON s.destination_id = d.id
      ORDER BY d.name LIMIT ${lim(limit, 50)}`,
  );
  const styles = await stylesFor(found.map((d) => d.id));
  return found
    .map((d) => ({
      ...d,
      reviews_count: Number(d.reviews_count),
      rating_avg: Number(d.rating_avg),
      styles: styles.get(d.id) ?? [],
    }))
    .filter((d) => !style || d.styles.includes(style))
    .sort((a, b) => b.reviews_count - a.reviews_count || a.name.localeCompare(b.name));
}

export async function getDestination(slug: string): Promise<DestinationWithStats | null> {
  const d = await one<DestinationWithStats>(
    `SELECT ${DESTINATION_COLUMNS}, COALESCE(s.reviews_count, 0) AS reviews_count, COALESCE(s.rating_avg, 0) AS rating_avg
       FROM destinations d LEFT JOIN destination_stats s ON s.destination_id = d.id
      WHERE d.slug = $1`,
    [slug],
  );
  if (!d) return null;
  const styles = await stylesFor([d.id]);
  return {
    ...d,
    reviews_count: Number(d.reviews_count),
    rating_avg: Number(d.rating_avg),
    styles: styles.get(d.id) ?? [],
  };
}

export async function listPlaces(
  filters: { destinationId?: string; type?: PlaceType; limit?: number; minReviews?: number } = {},
): Promise<PlaceSummary[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.destinationId) where.push(`destination_id = $${params.push(filters.destinationId)}`);
  if (filters.type) where.push(`type = $${params.push(filters.type)}`);
  if (filters.minReviews) where.push(`reviews_count >= $${params.push(filters.minReviews)}`);
  return rows<PlaceSummary>(
    `SELECT ${PLACE_SUMMARY} FROM places ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY rating_avg DESC, reviews_count DESC, name LIMIT ${lim(filters.limit, 30)}`,
    params,
  );
}

export async function getPlace(slug: string) {
  const place = await one<Place>(
    `SELECT id, destination_id, slug, name, type, description, address, city, state, country,
            latitude, longitude, image_url, website, phone, rating_avg, reviews_count, is_demo
       FROM places WHERE slug = $1`,
    [slug],
  );
  if (!place) return null;
  const destinations = await destinationsById([place.destination_id]);
  const d = place.destination_id ? destinations.get(place.destination_id) : undefined;
  return { ...place, destination: d ? { slug: d.slug, name: d.name, state: d.state } : null };
}

export async function getReviewCategories(type: PlaceType): Promise<ReviewCategory[]> {
  return rows<ReviewCategory>(
    `SELECT rc.id, rc."key" AS "key", rc.label
       FROM place_categories pc JOIN review_categories rc ON rc.id = pc.review_category_id
      WHERE pc.place_type = $1 ORDER BY pc.position`,
    [type],
  );
}

/** Opções compactas para selects de formulário. */
export async function listDestinationOptions() {
  return rows<Pick<Destination, "id" | "slug" | "name" | "state">>(
    "SELECT id, slug, name, state FROM destinations ORDER BY name",
  );
}

export async function listPlaceOptions() {
  return rows<Pick<Place, "id" | "name" | "type" | "destination_id">>(
    "SELECT id, name, type, destination_id FROM places ORDER BY name LIMIT 500",
  );
}

// ---------------------------------------------------------------------------
// Avaliações
// ---------------------------------------------------------------------------
type ReviewRow = Omit<Review, "author" | "scores" | "place">;

export async function listReviews(filters: {
  placeId?: string;
  userId?: string;
  limit?: number;
}): Promise<Review[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.placeId) where.push(`place_id = $${params.push(filters.placeId)}`);
  if (filters.userId) where.push(`user_id = $${params.push(filters.userId)}`);
  const found = await rows<ReviewRow>(
    `SELECT id, place_id, user_id, rating, title, body, visited_on, created_at FROM reviews
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC LIMIT ${lim(filters.limit, 50)}`,
    params,
  );
  if (!found.length) return [];

  const ids = inList(
    found.map((r) => r.id),
    1,
  );
  const [authors, places, scores] = await Promise.all([
    authorsById(found.map((r) => r.user_id)),
    placesById(found.map((r) => r.place_id)),
    rows<{ review_id: string; score: number; key: string; label: string }>(
      `SELECT s.review_id, s.score, rc."key" AS "key", rc.label
         FROM review_category_scores s JOIN review_categories rc ON rc.id = s.category_id
        WHERE s.review_id ${ids.sql}`,
      ids.params,
    ),
  ]);
  return found.map((r) => ({
    ...r,
    author: authors.get(r.user_id)!,
    scores: scores
      .filter((s) => s.review_id === r.id)
      .map((s) => ({ score: s.score, category: { key: s.key, label: s.label } })),
    place: brief(places.get(r.place_id)),
  }));
}

export async function listDestinationReviewPhotos(destinationId: string, limit = 8) {
  const found = await rows<{
    id: string;
    storage_path: string;
    alt: string | null;
    post_id: string;
  }>(
    `SELECT ph.id, ph.storage_path, ph.alt, ph.post_id
       FROM post_photos ph JOIN posts p ON p.id = ph.post_id
      WHERE p.destination_id = $1 ORDER BY ph.created_at DESC LIMIT ${lim(limit, 8)}`,
    [destinationId],
  );
  return found.map(({ post_id, ...photo }) => ({ ...photo, post: { id: post_id } }));
}

// ---------------------------------------------------------------------------
// Publicações
// ---------------------------------------------------------------------------
type PostRow = Pick<
  Post,
  | "id"
  | "user_id"
  | "body"
  | "trip_start"
  | "trip_end"
  | "spent_cents"
  | "rating"
  | "tags"
  | "created_at"
> & { destination_id: string | null; hotel_place_id: string | null };

const POST_COLUMNS =
  "id, user_id, body, trip_start, trip_end, spent_cents, rating, tags, created_at, destination_id, hotel_place_id";

async function hydratePosts(found: PostRow[]): Promise<Post[]> {
  if (!found.length) return [];
  const postIds = found.map((p) => p.id);
  const ids = inList(postIds, 1);
  const [authors, destinations, hotels, photos, likes, comments] = await Promise.all([
    authorsById(found.map((p) => p.user_id)),
    destinationsById(found.map((p) => p.destination_id)),
    placesById(found.map((p) => p.hotel_place_id)),
    rows<PostPhoto & { post_id: string }>(
      `SELECT id, post_id, storage_path, alt, position FROM post_photos WHERE post_id ${ids.sql} ORDER BY position`,
      ids.params,
    ),
    countsBy("post_likes", "post_id", postIds),
    countsBy("comments", "post_id", postIds),
  ]);
  return found.map(({ destination_id, hotel_place_id, ...p }) => {
    const d = destination_id ? destinations.get(destination_id) : undefined;
    return {
      ...p,
      tags: p.tags ?? [],
      author: authors.get(p.user_id)!,
      destination: d ? { slug: d.slug, name: d.name, state: d.state } : null,
      hotel: brief(hotel_place_id ? hotels.get(hotel_place_id) : undefined),
      photos: photos
        .filter((ph) => ph.post_id === p.id)
        .map(({ id, storage_path, alt, position }) => ({ id, storage_path, alt, position })),
      likes: [{ count: likes.get(p.id) ?? 0 }],
      comments: [{ count: comments.get(p.id) ?? 0 }],
    };
  });
}

export async function listPosts(
  filters: {
    userId?: string;
    userIds?: string[];
    destinationId?: string;
    ids?: string[];
    limit?: number;
  } = {},
): Promise<Post[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.userId) where.push(`user_id = $${params.push(filters.userId)}`);
  if (filters.userIds) {
    const list = inList(filters.userIds, params.length + 1);
    where.push(`user_id ${list.sql}`);
    params.push(...list.params);
  }
  if (filters.destinationId) where.push(`destination_id = $${params.push(filters.destinationId)}`);
  if (filters.ids) {
    const list = inList(filters.ids, params.length + 1);
    where.push(`id ${list.sql}`);
    params.push(...list.params);
  }
  const found = await rows<PostRow>(
    `SELECT ${POST_COLUMNS} FROM posts ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC LIMIT ${lim(filters.limit, 20)}`,
    params,
  );
  return hydratePosts(found);
}

export async function listPostsByPlace(placeId: string, limit = 6): Promise<Post[]> {
  const found = await rows<{ id: string }>(
    `SELECT DISTINCT p.id, p.created_at FROM posts p
       LEFT JOIN post_places pp ON pp.post_id = p.id
      WHERE pp.place_id = $1 OR p.hotel_place_id = $1
      ORDER BY p.created_at DESC LIMIT 50`,
    [placeId],
  );
  if (!found.length) return [];
  return listPosts({ ids: found.map((r) => r.id), limit });
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const row = await one<PostRow>(`SELECT ${POST_COLUMNS} FROM posts WHERE id = $1`, [id]);
  if (!row) return null;
  const [[post], places, beachPicks] = await Promise.all([
    hydratePosts([row]),
    rows<Pick<Place, "slug" | "name" | "type">>(
      `SELECT pl.slug, pl.name, pl.type FROM post_places pp JOIN places pl ON pl.id = pp.place_id
        WHERE pp.post_id = $1 ORDER BY pl.name`,
      [id],
    ),
    rows<{ kind: PostDetail["beachPicks"][number]["kind"]; slug: string; name: string }>(
      `SELECT b.kind, pl.slug, pl.name FROM post_beach_picks b JOIN places pl ON pl.id = b.place_id
        WHERE b.post_id = $1`,
      [id],
    ),
  ]);
  const order = ["favorita", "recomenda", "nao_voltaria"];
  return {
    ...post,
    places: places.map((place) => ({ place })),
    beachPicks: beachPicks
      .sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind))
      .map(({ kind, slug, name }) => ({ kind, place: { slug, name } })),
  };
}

export async function listComments(postId: string): Promise<Comment[]> {
  const found = await rows<Omit<Comment, "author">>(
    "SELECT id, post_id, user_id, body, created_at FROM comments WHERE post_id = $1 ORDER BY created_at LIMIT 200",
    [postId],
  );
  const authors = await authorsById(found.map((c) => c.user_id));
  return found.map((c) => ({ ...c, author: authors.get(c.user_id)! }));
}

// ---------------------------------------------------------------------------
// Roteiros
// ---------------------------------------------------------------------------
type ItineraryRow = Omit<Itinerary, "author" | "destination" | "likes"> & {
  destination_id: string | null;
};
const ITINERARY_COLUMNS =
  "id, user_id, title, description, days_count, tags, is_public, copied_from, created_at, destination_id";

async function hydrateItineraries(found: ItineraryRow[]): Promise<Itinerary[]> {
  if (!found.length) return [];
  const [authors, destinations, likes] = await Promise.all([
    authorsById(found.map((i) => i.user_id)),
    destinationsById(found.map((i) => i.destination_id)),
    countsBy(
      "itinerary_likes",
      "itinerary_id",
      found.map((i) => i.id),
    ),
  ]);
  return found.map(({ destination_id, ...i }) => {
    const d = destination_id ? destinations.get(destination_id) : undefined;
    return {
      ...i,
      tags: i.tags ?? [],
      author: authors.get(i.user_id)!,
      destination: d ? { slug: d.slug, name: d.name, state: d.state } : null,
      likes: [{ count: likes.get(i.id) ?? 0 }],
    };
  });
}

/** Roteiros visíveis: públicos, mais os privados do próprio `viewerId` (a não ser com publicOnly). */
export async function listItineraries(
  filters: {
    userId?: string;
    destinationId?: string;
    ids?: string[];
    tags?: string[];
    limit?: number;
    publicOnly?: boolean;
    viewerId?: Viewer;
  } = {},
): Promise<Itinerary[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.publicOnly || !filters.viewerId) where.push("is_public = TRUE");
  else where.push(`(is_public = TRUE OR user_id = $${params.push(filters.viewerId)})`);
  if (filters.userId) where.push(`user_id = $${params.push(filters.userId)}`);
  if (filters.destinationId) where.push(`destination_id = $${params.push(filters.destinationId)}`);
  if (filters.ids) {
    const list = inList(filters.ids, params.length + 1);
    where.push(`id ${list.sql}`);
    params.push(...list.params);
  }
  let found = await rows<ItineraryRow>(
    `SELECT ${ITINERARY_COLUMNS} FROM itineraries WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC LIMIT ${lim(filters.tags?.length ? 200 : filters.limit, 24)}`,
    params,
  );
  // Filtro por estilos (sobreposição de arrays) feito aqui: o H2 não tem o operador && do Postgres.
  if (filters.tags?.length) {
    const wanted = new Set(filters.tags);
    found = found
      .filter((i) => (i.tags ?? []).some((t) => wanted.has(t)))
      .slice(0, lim(filters.limit, 24));
  }
  return hydrateItineraries(found);
}

export async function getItinerary(id: string, viewerId?: Viewer): Promise<ItineraryDetail | null> {
  const row = await one<ItineraryRow>(
    `SELECT ${ITINERARY_COLUMNS} FROM itineraries WHERE id = $1 AND (is_public = TRUE OR user_id = $2)`,
    [id, viewerId ?? null],
  );
  if (!row) return null;
  const [[itinerary], days, stops] = await Promise.all([
    hydrateItineraries([row]),
    rows<Omit<ItineraryDay, "stops">>(
      "SELECT id, day_number, title, description FROM itinerary_days WHERE itinerary_id = $1 ORDER BY day_number",
      [id],
    ),
    rows<{
      id: string;
      day_id: string;
      custom_name: string | null;
      start_time: string | null;
      notes: string | null;
      position: number;
      place_id: string | null;
    }>(
      `SELECT ip.id, ip.day_id, ip.custom_name, ip.start_time, ip.notes, ip.position, ip.place_id
         FROM itinerary_places ip JOIN itinerary_days d ON d.id = ip.day_id
        WHERE d.itinerary_id = $1 ORDER BY ip.position`,
      [id],
    ),
  ]);
  const places = await placesById(stops.map((s) => s.place_id));
  return {
    ...itinerary,
    days: days.map((d) => ({
      ...d,
      stops: stops
        .filter((s) => s.day_id === d.id)
        .map(({ day_id: _day, place_id, start_time, ...s }) => {
          const p = place_id ? places.get(place_id) : undefined;
          return {
            ...s,
            start_time: start_time ? start_time.slice(0, 5) : null,
            place: p ? { slug: p.slug, name: p.name, type: p.type } : null,
          };
        }),
    })),
  };
}

// ---------------------------------------------------------------------------
// Estado do usuário atual (curtiu? salvou? segue?)
// ---------------------------------------------------------------------------
export async function viewerPostState(userId: string | undefined, postIds: string[]) {
  const empty = { liked: new Set<string>(), saved: new Set<string>() };
  if (!userId || !postIds.length) return empty;
  const list = inList(postIds, 2);
  const [likes, saves] = await Promise.all([
    rows<{ post_id: string }>(
      `SELECT post_id FROM post_likes WHERE user_id = $1 AND post_id ${list.sql}`,
      [userId, ...list.params],
    ),
    rows<{ post_id: string }>(
      `SELECT post_id FROM post_saves WHERE user_id = $1 AND post_id ${list.sql}`,
      [userId, ...list.params],
    ),
  ]);
  return {
    liked: new Set(likes.map((r) => r.post_id)),
    saved: new Set(saves.map((r) => r.post_id)),
  };
}

export async function viewerItineraryState(userId: string | undefined, id: string) {
  if (!userId) return { liked: false, saved: false };
  const [like, save] = await Promise.all([
    one("SELECT itinerary_id FROM itinerary_likes WHERE user_id = $1 AND itinerary_id = $2", [
      userId,
      id,
    ]),
    one("SELECT itinerary_id FROM itinerary_saves WHERE user_id = $1 AND itinerary_id = $2", [
      userId,
      id,
    ]),
  ]);
  return { liked: Boolean(like), saved: Boolean(save) };
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------
export async function getProfileByUsername(username: string) {
  return one<Profile>(
    "SELECT id, username, full_name, bio, avatar_url, created_at FROM profiles WHERE username = $1",
    [username.toLowerCase()],
  );
}

export async function getProfileStats(userId: string) {
  const count = (sql: string) => one<{ n: number }>(sql, [userId]).then((r) => Number(r?.n ?? 0));
  const [posts, reviews, itineraries, followers, following] = await Promise.all([
    count("SELECT COUNT(*) AS n FROM posts WHERE user_id = $1"),
    count("SELECT COUNT(*) AS n FROM reviews WHERE user_id = $1"),
    count("SELECT COUNT(*) AS n FROM itineraries WHERE user_id = $1 AND is_public = TRUE"),
    count("SELECT COUNT(*) AS n FROM follows WHERE following_id = $1"),
    count("SELECT COUNT(*) AS n FROM follows WHERE follower_id = $1"),
  ]);
  return { posts, reviews, itineraries, followers, following };
}

export async function isFollowing(followerId: string | undefined, followingId: string) {
  if (!followerId || followerId === followingId) return false;
  return Boolean(
    await one("SELECT follower_id FROM follows WHERE follower_id = $1 AND following_id = $2", [
      followerId,
      followingId,
    ]),
  );
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const found = await rows<{ following_id: string }>(
    "SELECT following_id FROM follows WHERE follower_id = $1 LIMIT 500",
    [userId],
  );
  return found.map((r) => r.following_id);
}

export async function listUserPhotos(userId: string, limit = 30) {
  return rows<{ id: string; storage_path: string; alt: string | null; post_id: string }>(
    `SELECT id, storage_path, alt, post_id FROM post_photos WHERE user_id = $1
      ORDER BY created_at DESC LIMIT ${lim(limit, 30)}`,
    [userId],
  );
}

// ---------------------------------------------------------------------------
// Reclamações
// ---------------------------------------------------------------------------
export async function listComplaints(filters: {
  placeId?: string;
  userId?: string;
  limit?: number;
}): Promise<Complaint[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.placeId) where.push(`place_id = $${params.push(filters.placeId)}`);
  if (filters.userId) where.push(`user_id = $${params.push(filters.userId)}`);
  const found = await rows<Omit<Complaint, "author" | "photos" | "responses" | "place">>(
    `SELECT id, place_id, user_id, category, title, description, status, created_at FROM complaints
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC LIMIT ${lim(filters.limit, 30)}`,
    params,
  );
  if (!found.length) return [];
  const ids = inList(
    found.map((c) => c.id),
    1,
  );
  const [authors, places, photos, responses] = await Promise.all([
    authorsById(found.map((c) => c.user_id)),
    placesById(found.map((c) => c.place_id)),
    rows<{ id: string; complaint_id: string; storage_path: string }>(
      `SELECT id, complaint_id, storage_path FROM complaint_photos WHERE complaint_id ${ids.sql} ORDER BY created_at`,
      ids.params,
    ),
    rows<{
      id: string;
      complaint_id: string;
      body: string;
      created_at: string;
      business_name: string | null;
    }>(
      `SELECT r.id, r.complaint_id, r.body, r.created_at, b.name AS business_name
         FROM complaint_responses r LEFT JOIN business_profiles b ON b.id = r.business_id
        WHERE r.complaint_id ${ids.sql} ORDER BY r.created_at`,
      ids.params,
    ),
  ]);
  return found.map((c) => ({
    ...c,
    author: authors.get(c.user_id)!,
    photos: photos
      .filter((p) => p.complaint_id === c.id)
      .map(({ id, storage_path }) => ({ id, storage_path })),
    responses: responses
      .filter((r) => r.complaint_id === c.id)
      .map(({ id, body, created_at, business_name }) => ({
        id,
        body,
        created_at,
        business: business_name ? { name: business_name } : null,
      })),
    place: brief(places.get(c.place_id)),
  }));
}

// ---------------------------------------------------------------------------
// Área privada (sempre filtrada pelo próprio usuário)
// ---------------------------------------------------------------------------
export async function listSavedPostIds(userId: string) {
  const found = await rows<{ post_id: string }>(
    "SELECT post_id FROM post_saves WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
    [userId],
  );
  return found.map((r) => r.post_id);
}

export async function listSavedItineraryIds(userId: string) {
  const found = await rows<{ itinerary_id: string }>(
    "SELECT itinerary_id FROM itinerary_saves WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
    [userId],
  );
  return found.map((r) => r.itinerary_id);
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const found = await rows<Omit<Notification, "actor"> & { actor_id: string | null }>(
    `SELECT id, type, read_at, created_at, post_id, itinerary_id, complaint_id, actor_id
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  const actors = await authorsById(
    found.map((n) => n.actor_id).filter((id): id is string => Boolean(id)),
  );
  return found.map(({ actor_id, ...n }) => ({
    ...n,
    actor: actor_id ? (actors.get(actor_id) ?? null) : null,
  }));
}

export async function countUnreadNotifications(userId: string) {
  const row = await one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL",
    [userId],
  );
  return Number(row?.n ?? 0);
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

const TRIP_SELECT = `SELECT t.id, t.start_date, t.end_date, t.travelers, t.budget_cents, t.preferences,
        d.id AS d_id, d.slug AS d_slug, d.name AS d_name, d.state AS d_state
   FROM trip_plans t JOIN destinations d ON d.id = t.destination_id`;
type TripRaw = Omit<TripPlanRow, "destination"> & {
  d_id: string;
  d_slug: string;
  d_name: string;
  d_state: string;
};
const toTrip = ({ d_id, d_slug, d_name, d_state, ...t }: TripRaw): TripPlanRow => ({
  ...t,
  preferences: t.preferences ?? [],
  destination: { id: d_id, slug: d_slug, name: d_name, state: d_state },
});

export async function listTripPlans(userId: string): Promise<TripPlanRow[]> {
  return (
    await rows<TripRaw>(`${TRIP_SELECT} WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 20`, [
      userId,
    ])
  ).map(toTrip);
}

/** Plano de viagem é privado: só o dono vê. */
export async function getTripPlan(id: string, userId: string): Promise<TripPlanRow | null> {
  const row = await one<TripRaw>(`${TRIP_SELECT} WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
  return row ? toTrip(row) : null;
}

// ---------------------------------------------------------------------------
// Busca (sem diferenciar acentos: colunas search_key guardam o texto normalizado)
// ---------------------------------------------------------------------------
export async function searchAll(q: string, viewerId?: Viewer): Promise<SearchResults> {
  const term = `%${normalizePlace(q).replace(/[%_]/g, "")}%`;
  const [destinations, places, profiles, itineraries] = await Promise.all([
    rows<SearchResults["destinations"][number]>(
      "SELECT id, slug, name, state, country FROM destinations WHERE search_key LIKE $1 ORDER BY name LIMIT 8",
      [term],
    ),
    rows<PlaceSummary>(
      `SELECT ${PLACE_SUMMARY} FROM places WHERE search_key LIKE $1 ORDER BY reviews_count DESC, name LIMIT 8`,
      [term],
    ),
    rows<ProfileSummary>(
      "SELECT id, username, full_name, avatar_url FROM profiles WHERE search_key LIKE $1 ORDER BY username LIMIT 8",
      [term],
    ),
    rows<SearchResults["itineraries"][number]>(
      `SELECT id, title, days_count FROM itineraries
        WHERE search_key LIKE $1 AND (is_public = TRUE OR user_id = $2)
        ORDER BY created_at DESC LIMIT 8`,
      [term, viewerId ?? null],
    ),
  ]);
  return { destinations, places, profiles, itineraries };
}

// ---------------------------------------------------------------------------
// Notas e dicas de destino
// ---------------------------------------------------------------------------
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export async function getDestinationInsights(
  destinationId: string,
  viewerId?: Viewer,
): Promise<DestinationInsights> {
  const [reviewRows, tipRows] = await Promise.all([
    rows<Omit<DestinationReview, "author" | "best_months"> & { best_months: string | null }>(
      `SELECT id, destination_id, user_id, rating, body, visited_month, visited_year, best_months, daily_cost_cents, created_at
         FROM destination_reviews WHERE destination_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [destinationId],
    ),
    rows<Omit<DestinationTip, "author">>(
      `SELECT t.id, t.destination_id, t.user_id, t.topic, t.title, t.body, t.created_at,
              (SELECT COUNT(*) FROM destination_tip_votes v WHERE v.tip_id = t.id) AS votes
         FROM destination_tips t WHERE t.destination_id = $1
        ORDER BY votes DESC, t.created_at DESC LIMIT 300`,
      [destinationId],
    ),
  ]);
  const authors = await authorsById([
    ...reviewRows.map((r) => r.user_id),
    ...tipRows.map((t) => t.user_id),
  ]);
  const reviews: DestinationReview[] = reviewRows.map((r) => ({
    ...r,
    best_months: (r.best_months ?? "").split(",").filter(Boolean).map(Number),
    author: authors.get(r.user_id)!,
  }));
  const tips: DestinationTip[] = tipRows.map((t) => ({
    ...t,
    votes: Number(t.votes),
    author: authors.get(t.user_id)!,
  }));

  const monthVotes = Array.from({ length: 12 }, () => 0);
  for (const r of reviews) for (const m of r.best_months) monthVotes[m - 1] += 1;
  const costs = reviews.map((r) => r.daily_cost_cents).filter((c): c is number => c !== null);

  let viewerVotedTipIds: string[] = [];
  if (viewerId && tips.length) {
    const list = inList(
      tips.map((t) => t.id),
      2,
    );
    viewerVotedTipIds = (
      await rows<{ tip_id: string }>(
        `SELECT tip_id FROM destination_tip_votes WHERE user_id = $1 AND tip_id ${list.sql}`,
        [viewerId, ...list.params],
      )
    ).map((v) => v.tip_id);
  }

  return {
    reviews,
    tips,
    reviewsCount: reviews.length,
    ratingAvg: reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : null,
    monthVotes,
    dailyCost: costs.length ? { medianCents: median(costs), from: costs.length } : null,
    viewerReviewed: Boolean(viewerId && reviews.some((r) => r.user_id === viewerId)),
    viewerVotedTipIds,
  };
}

// ---------------------------------------------------------------------------
// Achadinhos
// ---------------------------------------------------------------------------
type AchadoRow = Omit<Achado, "author" | "destination" | "photos" | "saves"> & {
  destination_id: string | null;
};
const ACHADO_COLUMNS =
  "id, user_id, title, body, category, latitude, longitude, location_name, tip, created_at, destination_id";

async function hydrateAchados(found: AchadoRow[]): Promise<Achado[]> {
  if (!found.length) return [];
  const ids = inList(
    found.map((a) => a.id),
    1,
  );
  const [authors, destinations, photos, saves] = await Promise.all([
    authorsById(found.map((a) => a.user_id)),
    destinationsById(found.map((a) => a.destination_id)),
    rows<{ id: string; achado_id: string; storage_path: string; alt: string | null }>(
      `SELECT id, achado_id, storage_path, alt FROM achado_photos WHERE achado_id ${ids.sql} ORDER BY position`,
      ids.params,
    ),
    countsBy(
      "achado_saves",
      "achado_id",
      found.map((a) => a.id),
    ),
  ]);
  return found.map(({ destination_id, ...a }) => {
    const d = destination_id ? destinations.get(destination_id) : undefined;
    return {
      ...a,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
      author: authors.get(a.user_id)!,
      destination: d ? { slug: d.slug, name: d.name, state: d.state } : null,
      photos: photos
        .filter((p) => p.achado_id === a.id)
        .map(({ id, storage_path, alt }) => ({ id, storage_path, alt })),
      saves: saves.get(a.id) ?? 0,
    };
  });
}

export async function listAchados(
  filters: { destinationId?: string; userId?: string; ids?: string[]; limit?: number } = {},
): Promise<Achado[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.destinationId) where.push(`destination_id = $${params.push(filters.destinationId)}`);
  if (filters.userId) where.push(`user_id = $${params.push(filters.userId)}`);
  if (filters.ids) {
    const list = inList(filters.ids, params.length + 1);
    where.push(`id ${list.sql}`);
    params.push(...list.params);
  }
  const found = await rows<AchadoRow>(
    `SELECT ${ACHADO_COLUMNS} FROM achados ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC LIMIT ${lim(filters.limit, 30)}`,
    params,
  );
  return hydrateAchados(found);
}

export async function getAchado(id: string): Promise<Achado | null> {
  const row = await one<AchadoRow>(`SELECT ${ACHADO_COLUMNS} FROM achados WHERE id = $1`, [id]);
  return row ? (await hydrateAchados([row]))[0] : null;
}

export async function viewerSavedAchado(userId: string | undefined, achadoId: string) {
  if (!userId) return false;
  return Boolean(
    await one("SELECT achado_id FROM achado_saves WHERE user_id = $1 AND achado_id = $2", [
      userId,
      achadoId,
    ]),
  );
}

// ---------------------------------------------------------------------------
// Roteiro sugerido pela comunidade: reúne os sinais (notas, votos, salvos, uso em roteiros)
// ---------------------------------------------------------------------------
const ACHADO_KIND: Record<string, Candidate["kind"]> = {
  comida: "food",
  cafe: "cafe",
  praia: "beach",
  mirante: "sight",
  trilha: "sight",
  cachoeira: "sight",
  cultura: "sight",
  compras: "other",
  outro: "other",
};
const TIP_KIND: Partial<Record<string, Candidate["kind"]>> = {
  cafe_da_manha: "breakfast",
  onde_comer: "food",
  passeios: "sight",
};

export async function getSuggestionCandidates(destinationId: string): Promise<Candidate[]> {
  const [places, picks, uses, achados, tips] = await Promise.all([
    rows<{
      id: string;
      slug: string;
      name: string;
      type: PlaceType;
      rating_avg: number;
      reviews_count: number;
    }>(
      "SELECT id, slug, name, type, rating_avg, reviews_count FROM places WHERE destination_id = $1",
      [destinationId],
    ),
    rows<{ place_id: string; kind: string; n: number }>(
      `SELECT b.place_id, b.kind, COUNT(*) AS n FROM post_beach_picks b
         JOIN places p ON p.id = b.place_id WHERE p.destination_id = $1 GROUP BY b.place_id, b.kind`,
      [destinationId],
    ),
    rows<{ place_id: string; n: number }>(
      `SELECT ip.place_id, COUNT(DISTINCT d.itinerary_id) AS n
         FROM itinerary_places ip
         JOIN itinerary_days d ON d.id = ip.day_id
         JOIN itineraries i ON i.id = d.itinerary_id
         JOIN places p ON p.id = ip.place_id
        WHERE i.is_public = TRUE AND p.destination_id = $1
        GROUP BY ip.place_id`,
      [destinationId],
    ),
    rows<{ id: string; title: string; category: string; saves: number }>(
      `SELECT a.id, a.title, a.category, (SELECT COUNT(*) FROM achado_saves s WHERE s.achado_id = a.id) AS saves
         FROM achados a WHERE a.destination_id = $1`,
      [destinationId],
    ),
    rows<{ id: string; title: string; topic: string; votes: number }>(
      `SELECT t.id, t.title, t.topic, (SELECT COUNT(*) FROM destination_tip_votes v WHERE v.tip_id = t.id) AS votes
         FROM destination_tips t WHERE t.destination_id = $1`,
      [destinationId],
    ),
  ]);
  const pick = (placeId: string, kind: string) =>
    Number(picks.find((p) => p.place_id === placeId && p.kind === kind)?.n ?? 0);
  return [
    ...places.map((p): Candidate => ({
      key: `place:${p.id}`,
      name: p.name,
      source: "place",
      kind: p.type,
      placeSlug: p.slug,
      ratingAvg: Number(p.rating_avg),
      reviewsCount: Number(p.reviews_count),
      recommendVotes: pick(p.id, "recomenda"),
      favoriteVotes: pick(p.id, "favorita"),
      avoidVotes: pick(p.id, "nao_voltaria"),
      itineraryUses: Number(uses.find((u) => u.place_id === p.id)?.n ?? 0),
    })),
    ...achados.map((a): Candidate => ({
      key: `achado:${a.id}`,
      name: a.title,
      source: "achado",
      kind: ACHADO_KIND[a.category] ?? "other",
      achadoId: a.id,
      // Achadinho conta como recomendação de quem postou, mais quem salvou.
      recommendVotes: 1,
      saves: Number(a.saves),
    })),
    ...tips
      .filter((t) => TIP_KIND[t.topic] && Number(t.votes) > 0)
      .map((t): Candidate => ({
        key: `tip:${t.id}`,
        name: t.title,
        source: "tip",
        kind: TIP_KIND[t.topic]!,
        tipVotes: Number(t.votes),
      })),
  ];
}

export type { ProfileSummary };
