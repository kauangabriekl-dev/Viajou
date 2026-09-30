/**
 * Tipos das tabelas do Supabase (espelham supabase/migrations).
 * Quando houver um projeto Supabase, gere a versão oficial com:
 *   npx supabase gen types typescript --project-id <id> > types/supabase.ts
 */

export type PlaceType = "hotel" | "restaurant" | "beach" | "attraction" | "tour" | "other";
export type ComplaintCategory =
  | "billing"
  | "customer_service"
  | "reservation"
  | "service"
  | "cleanliness"
  | "advertising"
  | "other";
export type ComplaintStatus = "pending" | "answered" | "resolved" | "closed";
export type ReportTarget = "post" | "comment" | "review" | "profile" | "photo";
export type ReportReason =
  "spam" | "offensive" | "false_information" | "fraud" | "inappropriate" | "other";
export type NotificationType =
  "follow" | "post_like" | "comment" | "comment_reply" | "itinerary_saved" | "business_response";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type ProfileSummary = Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;

export type Destination = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_url: string | null;
  is_demo: boolean;
};

export type Place = {
  id: string;
  destination_id: string | null;
  slug: string;
  name: string;
  type: PlaceType;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  website: string | null;
  phone: string | null;
  rating_avg: number;
  reviews_count: number;
  is_demo: boolean;
};

export type PlaceSummary = Pick<
  Place,
  | "id"
  | "slug"
  | "name"
  | "type"
  | "city"
  | "state"
  | "rating_avg"
  | "reviews_count"
  | "is_demo"
  | "image_url"
>;

export type ReviewCategory = { id: number; key: string; label: string };

export type Review = {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  visited_on: string | null;
  created_at: string;
  author: ProfileSummary;
  scores: { score: number; category: Pick<ReviewCategory, "key" | "label"> }[];
  place?: Pick<Place, "slug" | "name"> | null;
};

export type PostPhoto = { id: string; storage_path: string; alt: string | null; position: number };

export type Post = {
  id: string;
  user_id: string;
  body: string;
  trip_start: string | null;
  trip_end: string | null;
  spent_cents: number | null;
  rating: number | null;
  tags: string[];
  created_at: string;
  author: ProfileSummary;
  destination: Pick<Destination, "slug" | "name" | "state"> | null;
  hotel: Pick<Place, "slug" | "name"> | null;
  photos: PostPhoto[];
  likes: { count: number }[];
  comments: { count: number }[];
};

export type PostDetail = Post & {
  places: { place: Pick<Place, "slug" | "name" | "type"> }[];
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: ProfileSummary;
};

export type Itinerary = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  days_count: number;
  tags: string[];
  is_public: boolean;
  copied_from: string | null;
  created_at: string;
  author: ProfileSummary;
  destination: Pick<Destination, "slug" | "name" | "state"> | null;
  likes: { count: number }[];
};

export type ItineraryStop = {
  id: string;
  custom_name: string | null;
  start_time: string | null;
  notes: string | null;
  position: number;
  place: Pick<Place, "slug" | "name" | "type"> | null;
};

export type ItineraryDay = {
  id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  stops: ItineraryStop[];
};

export type ItineraryDetail = Itinerary & { days: ItineraryDay[] };

export type ComplaintResponse = {
  id: string;
  body: string;
  created_at: string;
  business: { name: string } | null;
};

export type Complaint = {
  id: string;
  place_id: string;
  user_id: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  author: ProfileSummary;
  photos: { id: string; storage_path: string }[];
  responses: ComplaintResponse[];
  place?: Pick<Place, "slug" | "name"> | null;
};

export type Notification = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  actor: ProfileSummary | null;
  post_id: string | null;
  itinerary_id: string | null;
  complaint_id: string | null;
};

export type SearchResults = {
  destinations: Pick<Destination, "id" | "slug" | "name" | "state" | "country">[];
  places: PlaceSummary[];
  profiles: ProfileSummary[];
  itineraries: Pick<Itinerary, "id" | "title" | "days_count">[];
};

export type DestinationWithStats = Destination & { reviews_count: number; rating_avg: number };
