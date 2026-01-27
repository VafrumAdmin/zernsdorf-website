-- =====================================================
-- ZernsdorfConnect - Komplettes Benutzer- und Community-System
-- =====================================================

-- Aktiviere UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BENUTZER-PROFILE (erweitert auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basis-Informationen
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,

    -- Kontakt & Adresse (optional, verschlüsselt speicherbar)
    phone TEXT,
    street TEXT,
    house_number TEXT,
    postal_code TEXT,
    city TEXT DEFAULT 'Zernsdorf',

    -- Arbeitsplatz (für Pendelrouten)
    work_street TEXT,
    work_house_number TEXT,
    work_postal_code TEXT,
    work_city TEXT,
    work_arrival_time TIME,

    -- Präferenzen
    preferred_language TEXT DEFAULT 'de',
    theme TEXT DEFAULT 'system',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,

    -- Datenspeicher-Präferenz
    store_data_locally BOOLEAN DEFAULT false, -- true = nur im Browser, false = in DB

    -- Müllabfuhr-Einstellungen
    waste_street_id TEXT,
    waste_notifications BOOLEAN DEFAULT false,
    waste_notification_time TIME DEFAULT '18:00',

    -- Bus/ÖPNV-Einstellungen
    favorite_bus_stops TEXT[], -- Array von Haltestellen-IDs
    commute_notifications BOOLEAN DEFAULT false,

    -- Statistiken
    posts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    listings_count INTEGER DEFAULT 0,
    reputation_points INTEGER DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- =====================================================
-- 2. ROLLEN-SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280', -- Farbe für Badge
    icon TEXT, -- Lucide Icon Name
    priority INTEGER DEFAULT 0, -- Höher = wichtiger
    is_system BOOLEAN DEFAULT false, -- System-Rollen können nicht gelöscht werden
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Rollen einfügen
INSERT INTO public.roles (name, display_name, description, color, icon, priority, is_system) VALUES
    ('admin', 'Administrator', 'Volle Kontrolle über alle Funktionen', '#EF4444', 'shield', 100, true),
    ('moderator', 'Moderator', 'Kann Inhalte moderieren und Benutzer verwarnen', '#F59E0B', 'shield-check', 50, true),
    ('user', 'Mitglied', 'Registrierter Benutzer', '#10B981', 'user', 10, true),
    ('verified', 'Verifiziert', 'Verifizierter Einwohner von Zernsdorf', '#3B82F6', 'badge-check', 15, true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. BENUTZERGRUPPEN (für Vereine, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    color TEXT DEFAULT '#6B7280',

    -- Einstellungen
    is_public BOOLEAN DEFAULT true, -- Öffentlich sichtbar
    is_open BOOLEAN DEFAULT true, -- Jeder kann beitreten
    requires_approval BOOLEAN DEFAULT false, -- Beitritt muss genehmigt werden

    -- Kontakt
    contact_email TEXT,
    website TEXT,

    -- Statistiken
    members_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Offiziell verifizierter Verein

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON public.groups(is_public);

-- =====================================================
-- 4. BENUTZER-ROLLEN-ZUORDNUNG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optionales Ablaufdatum
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- =====================================================
-- 5. GRUPPEN-MITGLIEDSCHAFT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES public.profiles(id),
    is_approved BOOLEAN DEFAULT true,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- =====================================================
-- 6. GRUPPEN-BERECHTIGUNGEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.group_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'owner', 'admin', 'moderator', 'member'

    -- Berechtigungen
    can_post BOOLEAN DEFAULT true,
    can_comment BOOLEAN DEFAULT true,
    can_create_events BOOLEAN DEFAULT false,
    can_invite_members BOOLEAN DEFAULT false,
    can_approve_members BOOLEAN DEFAULT false,
    can_remove_members BOOLEAN DEFAULT false,
    can_edit_group BOOLEAN DEFAULT false,
    can_delete_posts BOOLEAN DEFAULT false,
    can_pin_posts BOOLEAN DEFAULT false,
    can_manage_roles BOOLEAN DEFAULT false,

    UNIQUE(group_id, role)
);

-- =====================================================
-- 7. FORUM-KATEGORIEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',

    -- Hierarchie
    parent_id UUID REFERENCES public.forum_categories(id),
    sort_order INTEGER DEFAULT 0,

    -- Zugriff
    is_public BOOLEAN DEFAULT true,
    group_id UUID REFERENCES public.groups(id), -- NULL = öffentlich, sonst Gruppen-exklusiv
    min_role TEXT, -- Minimale Rolle zum Posten

    -- Statistiken
    threads_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Kategorien
INSERT INTO public.forum_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Allgemeines', 'allgemeines', 'Allgemeine Diskussionen rund um Zernsdorf', 'message-circle', '#6B7280', 1),
    ('Neuigkeiten', 'neuigkeiten', 'Aktuelle Nachrichten und Ankündigungen', 'newspaper', '#3B82F6', 2),
    ('Veranstaltungen', 'veranstaltungen', 'Diskussionen über lokale Events', 'calendar', '#10B981', 3),
    ('Vereine & Gruppen', 'vereine', 'Informationen zu lokalen Vereinen', 'users', '#8B5CF6', 4),
    ('Hilfe & Support', 'hilfe', 'Fragen zur Nutzung der Plattform', 'help-circle', '#F59E0B', 5),
    ('Feedback', 'feedback', 'Verbesserungsvorschläge für ZernsdorfConnect', 'message-square', '#EC4899', 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 8. FORUM-THREADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT, -- Vorgerenderte HTML-Version

    -- Status
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false, -- Für Frage-Threads
    solved_post_id UUID, -- Verweis auf Lösung

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,

    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES public.profiles(id),

    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON public.forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned ON public.forum_threads(is_pinned DESC, last_reply_at DESC);

-- =====================================================
-- 9. FORUM-BEITRÄGE (Antworten)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    content_html TEXT,

    -- Antwort auf anderen Post
    reply_to_id UUID REFERENCES public.forum_posts(id),

    -- Statistiken
    likes_count INTEGER DEFAULT 0,

    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES public.profiles(id),

    -- Bearbeitung
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    edit_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON public.forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at);

-- =====================================================
-- 10. KLEINANZEIGEN-KATEGORIEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.listing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    parent_id UUID REFERENCES public.listing_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Kategorien für Kleinanzeigen
INSERT INTO public.listing_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Biete', 'biete', 'Artikel und Dienstleistungen anbieten', 'tag', '#10B981', 1),
    ('Suche', 'suche', 'Artikel und Dienstleistungen suchen', 'search', '#3B82F6', 2),
    ('Verschenke', 'verschenke', 'Kostenlose Artikel', 'gift', '#8B5CF6', 3),
    ('Tausche', 'tausche', 'Tauschangebote', 'repeat', '#F59E0B', 4),
    ('Dienstleistungen', 'dienstleistungen', 'Lokale Dienstleistungen', 'briefcase', '#EC4899', 5),
    ('Immobilien', 'immobilien', 'Wohnungen und Häuser', 'home', '#6366F1', 6),
    ('Fahrzeuge', 'fahrzeuge', 'Autos, Fahrräder, etc.', 'car', '#14B8A6', 7),
    ('Jobs', 'jobs', 'Stellenangebote und -gesuche', 'briefcase', '#EF4444', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 11. KLEINANZEIGEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.listing_categories(id),

    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    description_html TEXT,

    -- Typ
    listing_type TEXT NOT NULL CHECK (listing_type IN ('offer', 'search', 'gift', 'swap')),

    -- Preis
    price DECIMAL(10, 2),
    price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable', 'free', 'swap', 'hourly')),
    currency TEXT DEFAULT 'EUR',

    -- Zustand (für Artikel)
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'for_parts')),

    -- Kontakt
    contact_phone TEXT,
    contact_email TEXT,
    show_phone BOOLEAN DEFAULT false,
    show_email BOOLEAN DEFAULT true,

    -- Standort
    location TEXT DEFAULT 'Zernsdorf',
    postal_code TEXT DEFAULT '15712',

    -- Bilder (URLs)
    images TEXT[], -- Array von Bild-URLs
    thumbnail_url TEXT,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'reserved', 'sold', 'expired', 'deleted')),

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    messages_count INTEGER DEFAULT 0,

    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,

    -- Ablauf
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(author_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_listings_author ON public.listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);

-- =====================================================
-- 12. KLEINANZEIGEN-BILDER
-- =====================================================

CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Metadaten
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id);

-- =====================================================
-- 13. NACHRICHTEN-SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referenz (optional)
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Anhänge
    attachments JSONB, -- [{url, type, name, size}]

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- =====================================================
-- 14. LIKES/FAVORITEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Polymorph: Entweder Thread, Post oder Listing
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Sicherstellen, dass nur eine Referenz gesetzt ist
    CONSTRAINT likes_single_target CHECK (
        (thread_id IS NOT NULL)::int +
        (post_id IS NOT NULL)::int +
        (listing_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_thread ON public.likes(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_listing ON public.likes(listing_id) WHERE listing_id IS NOT NULL;

-- =====================================================
-- 15. BENACHRICHTIGUNGEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    type TEXT NOT NULL, -- 'mention', 'reply', 'like', 'message', 'system', etc.
    title TEXT NOT NULL,
    content TEXT,

    -- Referenzen
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,

    -- Absender (optional)
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- E-Mail
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- 16. BENUTZER-AKTIVITÄT / AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    action TEXT NOT NULL, -- 'login', 'logout', 'create_post', 'update_profile', etc.
    entity_type TEXT, -- 'profile', 'thread', 'post', 'listing', etc.
    entity_id UUID,

    -- Details
    details JSONB,

    -- Request-Info
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- =====================================================
-- 17. BENUTZER-EINSTELLUNGEN (zusätzlich zu profile)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Forum-Einstellungen
    forum_signature TEXT,
    forum_posts_per_page INTEGER DEFAULT 20,
    forum_notify_replies BOOLEAN DEFAULT true,
    forum_notify_mentions BOOLEAN DEFAULT true,

    -- Kleinanzeigen-Einstellungen
    listings_notify_messages BOOLEAN DEFAULT true,
    listings_notify_favorites BOOLEAN DEFAULT false,

    -- Privatsphäre
    show_online_status BOOLEAN DEFAULT true,
    show_last_seen BOOLEAN DEFAULT true,
    allow_messages_from TEXT DEFAULT 'everyone', -- 'everyone', 'contacts', 'nobody'

    -- Sonstiges
    custom_settings JSONB, -- Für zukünftige Erweiterungen

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 18. REPORTS / MELDUNGEN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Was wird gemeldet
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,

    reason TEXT NOT NULL,
    details TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),

    -- Bearbeitung
    handled_by UUID REFERENCES public.profiles(id),
    handled_at TIMESTAMPTZ,
    resolution TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

-- =====================================================
-- 19. TRIGGER FÜR AUTOMATISCHE UPDATES
-- =====================================================

-- Funktion für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für alle Tabellen mit updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON public.forum_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 20. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Aktiviere RLS für alle Tabellen
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Policies für Profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies für Rollen (nur lesen für alle)
CREATE POLICY "Roles are viewable by everyone" ON public.roles
    FOR SELECT USING (true);

-- Policies für Gruppen
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
    FOR SELECT USING (is_public = true OR EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = groups.id AND user_id = auth.uid()
    ));

-- Policies für Forum-Kategorien
CREATE POLICY "Public categories are viewable by everyone" ON public.forum_categories
    FOR SELECT USING (is_public = true);

-- Policies für Forum-Threads
CREATE POLICY "Threads are viewable by everyone" ON public.forum_threads
    FOR SELECT USING (is_hidden = false);

CREATE POLICY "Authenticated users can create threads" ON public.forum_threads
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own threads" ON public.forum_threads
    FOR UPDATE USING (auth.uid() = author_id);

-- Policies für Forum-Posts
CREATE POLICY "Posts are viewable by everyone" ON public.forum_posts
    FOR SELECT USING (is_hidden = false);

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON public.forum_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Policies für Listings
CREATE POLICY "Active listings are viewable by everyone" ON public.listings
    FOR SELECT USING (status = 'active' AND is_hidden = false);

CREATE POLICY "Users can view their own listings" ON public.listings
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = author_id);

-- Policies für Nachrichten
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Policies für Benachrichtigungen
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies für Likes
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.likes
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 21. FUNKTION: Neuen Benutzer nach Registrierung anlegen
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );

    -- Standard-Rolle "user" zuweisen
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.id, id FROM public.roles WHERE name = 'user';

    -- Standard-Einstellungen erstellen
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger für neue Benutzer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 22. VIEWS FÜR EINFACHE ABFRAGEN
-- =====================================================

-- View: Benutzer mit Rollen
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT
    p.*,
    ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as role_names,
    ARRAY_AGG(r.display_name) FILTER (WHERE r.display_name IS NOT NULL) as role_display_names,
    MAX(r.priority) as highest_role_priority
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
GROUP BY p.id;

-- View: Forum-Threads mit Autor-Info
CREATE OR REPLACE VIEW public.forum_threads_with_author AS
SELECT
    t.*,
    p.username as author_username,
    p.nickname as author_nickname,
    p.avatar_url as author_avatar,
    c.name as category_name,
    c.slug as category_slug
FROM public.forum_threads t
JOIN public.profiles p ON t.author_id = p.id
JOIN public.forum_categories c ON t.category_id = c.id
WHERE t.is_hidden = false;

-- View: Listings mit Autor-Info
CREATE OR REPLACE VIEW public.listings_with_author AS
SELECT
    l.*,
    p.username as author_username,
    p.nickname as author_nickname,
    p.avatar_url as author_avatar,
    c.name as category_name,
    c.slug as category_slug
FROM public.listings l
JOIN public.profiles p ON l.author_id = p.id
JOIN public.listing_categories c ON l.category_id = c.id
WHERE l.is_hidden = false AND l.status = 'active';
