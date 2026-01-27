// =====================================================
// ZernsdorfConnect - Datenbank-Typen
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// =====================================================
// ENUMS
// =====================================================

export type ListingType = 'offer' | 'search' | 'gift' | 'swap';
export type PriceType = 'fixed' | 'negotiable' | 'free' | 'swap' | 'hourly';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'acceptable' | 'for_parts';
export type ListingStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'expired' | 'deleted';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type MessagePermission = 'everyone' | 'contacts' | 'nobody';

// =====================================================
// PROFILE
// =====================================================

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Kontakt & Adresse
  phone: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string;

  // Arbeitsplatz
  work_street: string | null;
  work_house_number: string | null;
  work_postal_code: string | null;
  work_city: string | null;
  work_arrival_time: string | null;

  // Präferenzen
  preferred_language: string;
  theme: string;
  email_notifications: boolean;
  push_notifications: boolean;
  store_data_locally: boolean;

  // Müllabfuhr
  waste_street_id: string | null;
  waste_notifications: boolean;
  waste_notification_time: string;

  // Bus/ÖPNV
  favorite_bus_stops: string[] | null;
  commute_notifications: boolean;

  // Statistiken
  posts_count: number;
  comments_count: number;
  listings_count: number;
  reputation_points: number;

  // Status
  is_verified: boolean;
  is_active: boolean;
  last_seen_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert extends Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>> {
  id: string;
  email: string;
}

export interface ProfileUpdate extends Partial<Omit<Profile, 'id' | 'email' | 'created_at'>> {}

// =====================================================
// ROLES
// =====================================================

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  icon: string | null;
  priority: number;
  is_system: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
}

// =====================================================
// GROUPS
// =====================================================

export interface Group {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  color: string;

  is_public: boolean;
  is_open: boolean;
  requires_approval: boolean;

  contact_email: string | null;
  website: string | null;

  members_count: number;
  posts_count: number;

  is_active: boolean;
  is_verified: boolean;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  invited_by: string | null;
  is_approved: boolean;
}

export interface GroupPermission {
  id: string;
  group_id: string;
  role: GroupRole;

  can_post: boolean;
  can_comment: boolean;
  can_create_events: boolean;
  can_invite_members: boolean;
  can_approve_members: boolean;
  can_remove_members: boolean;
  can_edit_group: boolean;
  can_delete_posts: boolean;
  can_pin_posts: boolean;
  can_manage_roles: boolean;
}

// =====================================================
// FORUM
// =====================================================

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;

  parent_id: string | null;
  sort_order: number;

  is_public: boolean;
  group_id: string | null;
  min_role: string | null;

  threads_count: number;
  posts_count: number;
  last_post_at: string | null;

  is_active: boolean;
  created_at: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string;

  title: string;
  slug: string;
  content: string;
  content_html: string | null;

  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  solved_post_id: string | null;

  views_count: number;
  replies_count: number;
  likes_count: number;

  is_approved: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_by: string | null;

  last_reply_at: string | null;
  last_reply_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface ForumThreadWithAuthor extends ForumThread {
  author_username: string;
  author_nickname: string | null;
  author_avatar: string | null;
  category_name: string;
  category_slug: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;

  content: string;
  content_html: string | null;

  reply_to_id: string | null;

  likes_count: number;

  is_approved: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_by: string | null;

  is_edited: boolean;
  edited_at: string | null;
  edit_reason: string | null;

  created_at: string;
  updated_at: string;
}

export interface ForumPostWithAuthor extends ForumPost {
  author: {
    id: string;
    username: string;
    nickname: string | null;
    avatar_url: string | null;
    posts_count: number;
    reputation_points: number;
  };
}

// =====================================================
// LISTINGS (Kleinanzeigen)
// =====================================================

export interface ListingCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  author_id: string;
  category_id: string;

  title: string;
  slug: string;
  description: string;
  description_html: string | null;

  listing_type: ListingType;

  price: number | null;
  price_type: PriceType;
  currency: string;

  condition: ItemCondition | null;

  contact_phone: string | null;
  contact_email: string | null;
  show_phone: boolean;
  show_email: boolean;

  location: string;
  postal_code: string;

  images: string[] | null;
  thumbnail_url: string | null;

  status: ListingStatus;

  views_count: number;
  favorites_count: number;
  messages_count: number;

  is_approved: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;

  expires_at: string;

  created_at: string;
  updated_at: string;
}

export interface ListingWithAuthor extends Listing {
  author_username: string;
  author_nickname: string | null;
  author_avatar: string | null;
  category_name: string;
  category_slug: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

// =====================================================
// MESSAGES
// =====================================================

export interface Conversation {
  id: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  is_muted: boolean;
  is_deleted: boolean;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Json | null;
  is_read: boolean;
  read_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & {
    profile: Pick<Profile, 'id' | 'username' | 'nickname' | 'avatar_url'>;
  })[];
  last_message: Message | null;
  unread_count: number;
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;

  thread_id: string | null;
  post_id: string | null;
  listing_id: string | null;
  message_id: string | null;

  from_user_id: string | null;

  is_read: boolean;
  read_at: string | null;

  email_sent: boolean;
  email_sent_at: string | null;

  created_at: string;
}

// =====================================================
// LIKES
// =====================================================

export interface Like {
  id: string;
  user_id: string;
  thread_id: string | null;
  post_id: string | null;
  listing_id: string | null;
  created_at: string;
}

// =====================================================
// REPORTS
// =====================================================

export interface Report {
  id: string;
  reporter_id: string;

  reported_user_id: string | null;
  thread_id: string | null;
  post_id: string | null;
  listing_id: string | null;
  message_id: string | null;

  reason: string;
  details: string | null;

  status: ReportStatus;

  handled_by: string | null;
  handled_at: string | null;
  resolution: string | null;

  created_at: string;
}

// =====================================================
// USER SETTINGS
// =====================================================

export interface UserSettings {
  id: string;
  user_id: string;

  forum_signature: string | null;
  forum_posts_per_page: number;
  forum_notify_replies: boolean;
  forum_notify_mentions: boolean;

  listings_notify_messages: boolean;
  listings_notify_favorites: boolean;

  show_online_status: boolean;
  show_last_seen: boolean;
  allow_messages_from: MessagePermission;

  custom_settings: Json | null;

  updated_at: string;
}

// =====================================================
// ACTIVITY LOG
// =====================================================

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface UserWithRoles extends Profile {
  role_names: string[];
  role_display_names: string[];
  highest_role_priority: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  password_confirm: string;
  username: string;
  first_name?: string;
  last_name?: string;
  accept_terms: boolean;
  accept_privacy: boolean;
}

export interface ProfileForm {
  username: string;
  first_name: string;
  last_name: string;
  nickname: string;
  bio: string;
  avatar_url: string;

  // Adresse
  street: string;
  house_number: string;
  postal_code: string;
  city: string;

  // Arbeitsplatz
  work_street: string;
  work_house_number: string;
  work_postal_code: string;
  work_city: string;
  work_arrival_time: string;
}

export interface ThreadForm {
  category_id: string;
  title: string;
  content: string;
}

export interface PostForm {
  content: string;
  reply_to_id?: string;
}

export interface ListingForm {
  category_id: string;
  title: string;
  description: string;
  listing_type: ListingType;
  price?: number;
  price_type: PriceType;
  condition?: ItemCondition;
  contact_phone?: string;
  contact_email?: string;
  show_phone: boolean;
  show_email: boolean;
  location: string;
  postal_code: string;
}

// =====================================================
// ADMIN SYSTEM TYPES
// =====================================================

// Business Categories
export interface BusinessCategory {
  id: string;
  name: string;
  display_name: string;
  display_name_en: string | null;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Businesses (Branchenverzeichnis)
export interface Business {
  id: string;
  name: string;
  slug: string | null;
  category_id: string | null;
  description: string | null;
  description_en: string | null;

  // Adresse
  street: string | null;
  house_number: string | null;
  postal_code: string;
  city: string;
  location: string;

  // Kontakt
  phone: string | null;
  email: string | null;
  website: string | null;

  // Öffnungszeiten
  opening_hours: OpeningHours | null;
  opening_hours_text: string | null;

  // Zusätzliche Infos
  tags: string[] | null;
  images: string[] | null;
  logo_url: string | null;

  // Status
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_recommended: boolean;

  // Sortierung
  sort_order: number;

  // Geodaten
  latitude: number | null;
  longitude: number | null;

  // Verwaltung
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  mo?: string;
  di?: string;
  mi?: string;
  do?: string;
  fr?: string;
  sa?: string;
  so?: string;
  feiertag?: string;
}

export interface BusinessWithCategory extends Business {
  category_name: string | null;
  category_display_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export interface BusinessInsert extends Partial<Omit<Business, 'id' | 'slug' | 'created_at' | 'updated_at'>> {
  name: string;
}

export interface BusinessUpdate extends Partial<Omit<Business, 'id' | 'created_at'>> {}

// Traffic Locations
export interface TrafficLocation {
  id: string;
  name: string;
  name_short: string | null;
  description: string | null;
  location_type: 'road' | 'tunnel' | 'bridge' | 'crossing' | 'construction';
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_active: boolean;
  show_on_dashboard: boolean;
  created_at: string;
}

// Traffic Status
export type TrafficStatusLevel = 'green' | 'yellow' | 'red' | 'gray';
export type TrafficStatusType = 'open' | 'closed' | 'restricted' | 'construction' | 'unknown';

export interface TrafficStatus {
  id: string;
  location_id: string;
  status: TrafficStatusType;
  status_level: TrafficStatusLevel;
  message: string | null;
  message_en: string | null;
  reason: string | null;
  valid_from: string;
  valid_until: string | null;
  source: 'admin' | 'api' | 'user_report';
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrafficStatusWithLocation extends TrafficStatus {
  location_name: string;
  location_short: string | null;
  location_type: string;
  show_on_dashboard: boolean;
}

export interface TrafficStatusInsert extends Partial<Omit<TrafficStatus, 'id' | 'created_at' | 'updated_at'>> {
  location_id: string;
}

// Events
export type EventCategory = 'general' | 'festival' | 'market' | 'sports' | 'culture' | 'community' | 'official';

export interface Event {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  description_en: string | null;

  // Datum & Zeit
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  is_all_day: boolean;

  // Ort
  location_name: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Kategorisierung
  category: EventCategory;

  // Veranstalter
  organizer_name: string | null;
  organizer_id: string | null;
  group_id: string | null;

  // Kontakt
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;

  // Medien
  image_url: string | null;
  images: string[] | null;

  // Status
  is_active: boolean;
  is_featured: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;

  // Teilnahme
  requires_registration: boolean;
  max_participants: number | null;
  registration_url: string | null;

  // Verwaltung
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInsert extends Partial<Omit<Event, 'id' | 'slug' | 'created_at' | 'updated_at'>> {
  title: string;
  start_date: string;
}

export interface EventUpdate extends Partial<Omit<Event, 'id' | 'created_at'>> {}

// Admin Settings
export interface AdminSettings {
  key: string;
  value: Json;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  estimated_end: string | null;
}

export interface SiteSettings {
  site_name: string;
  contact_email: string;
  show_weather: boolean;
  show_traffic: boolean;
  show_transit: boolean;
}

export interface TrafficSettings {
  auto_refresh: boolean;
  refresh_interval: number;
  show_construction: boolean;
}

export interface DirectorySettings {
  items_per_page: number;
  show_inactive: boolean;
  default_location: string;
}

// Admin Dashboard Stats
export interface AdminDashboardStats {
  businesses_count: number;
  businesses_active: number;
  events_upcoming: number;
  traffic_alerts: number;
  users_count: number;
}
