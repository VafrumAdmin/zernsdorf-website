-- =====================================================
-- ZernsdorfConnect - Community Features
-- Migration 004: Schwarzes Brett, Haustier-SOS,
-- Faktencheck, Müll-Melder, Forum
-- =====================================================

-- =====================================================
-- 1. SCHWARZES BRETT / LEIH-BÖRSE
-- =====================================================

-- Kategorien für Schwarzes Brett
CREATE TABLE IF NOT EXISTS public.bulletin_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_name_en TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.bulletin_categories (name, display_name, display_name_en, icon, color, sort_order) VALUES
    ('offer', 'Biete', 'Offering', 'gift', '#10B981', 1),
    ('search', 'Suche', 'Looking for', 'search', '#3B82F6', 2),
    ('lend', 'Verleihe', 'Lending', 'repeat', '#8B5CF6', 3),
    ('borrow', 'Leihen möchte', 'Want to borrow', 'hand', '#F59E0B', 4),
    ('help', 'Hilfe anbieten', 'Offering help', 'heart', '#EF4444', 5),
    ('help_needed', 'Hilfe gesucht', 'Need help', 'life-buoy', '#EC4899', 6),
    ('lost', 'Verloren', 'Lost', 'alert-circle', '#DC2626', 7),
    ('found', 'Gefunden', 'Found', 'check-circle', '#059669', 8),
    ('event_private', 'Private Veranstaltung', 'Private event', 'calendar', '#6366F1', 9),
    ('other', 'Sonstiges', 'Other', 'more-horizontal', '#6B7280', 10)
ON CONFLICT (name) DO NOTHING;

-- Schwarzes Brett Einträge
CREATE TABLE IF NOT EXISTS public.bulletin_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.bulletin_categories(id) ON DELETE SET NULL,

    -- Autor (kann anonym sein)
    author_id UUID,
    author_name TEXT, -- Für anonyme Posts oder Anzeigename
    author_email TEXT,
    author_phone TEXT,
    show_contact BOOLEAN DEFAULT true,

    -- Inhalt
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Leih-Börse spezifisch
    is_lending BOOLEAN DEFAULT false,
    lending_duration TEXT, -- z.B. "1 Woche", "Nach Absprache"
    deposit_required BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10, 2),

    -- Bilder
    images TEXT[],

    -- Ort
    location TEXT DEFAULT 'Zernsdorf',
    street TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_resolved BOOLEAN DEFAULT false, -- Erledigt/Gefunden/etc.
    resolved_at TIMESTAMPTZ,

    -- Gültigkeit
    valid_until DATE,

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    responses_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulletin_posts_category ON public.bulletin_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_active ON public.bulletin_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_created ON public.bulletin_posts(created_at DESC);

-- =====================================================
-- 2. HAUSTIER-SOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pet_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Typ
    alert_type TEXT NOT NULL, -- 'lost', 'found', 'sighting', 'rehome'

    -- Haustier-Info
    pet_type TEXT NOT NULL, -- 'dog', 'cat', 'bird', 'rabbit', 'other'
    pet_name TEXT,
    pet_breed TEXT,
    pet_color TEXT,
    pet_size TEXT, -- 'small', 'medium', 'large'
    pet_age TEXT,
    pet_gender TEXT, -- 'male', 'female', 'unknown'
    pet_chip_number TEXT,
    pet_distinctive_features TEXT, -- Besondere Merkmale

    -- Beschreibung
    description TEXT NOT NULL,

    -- Bilder
    images TEXT[],

    -- Ort & Zeit
    last_seen_location TEXT,
    last_seen_address TEXT,
    last_seen_date DATE,
    last_seen_time TIME,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Kontakt
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'expired'
    is_urgent BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,

    -- Autor
    author_id UUID,

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pet_alerts_type ON public.pet_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_pet_alerts_status ON public.pet_alerts(status);
CREATE INDEX IF NOT EXISTS idx_pet_alerts_pet_type ON public.pet_alerts(pet_type);
CREATE INDEX IF NOT EXISTS idx_pet_alerts_created ON public.pet_alerts(created_at DESC);

-- =====================================================
-- 3. FAKTENCHECK-ARCHIV
-- =====================================================

CREATE TABLE IF NOT EXISTS public.factchecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Claim (Behauptung)
    claim_title TEXT NOT NULL,
    claim_text TEXT NOT NULL,
    claim_source TEXT, -- Wo wurde es behauptet?
    claim_date DATE,

    -- Faktencheck
    verdict TEXT NOT NULL, -- 'true', 'mostly_true', 'partly_true', 'mostly_false', 'false', 'unverifiable'
    verdict_summary TEXT NOT NULL, -- Kurze Zusammenfassung
    explanation TEXT NOT NULL, -- Ausführliche Erklärung

    -- Quellen
    sources JSONB, -- Array von {title, url, date}

    -- Kategorie/Tags
    category TEXT, -- 'local', 'politics', 'health', 'environment', 'traffic', 'other'
    tags TEXT[],

    -- Medien
    images TEXT[],

    -- Autor (Admin/Moderator)
    author_id UUID,
    author_name TEXT,

    -- Status
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factchecks_verdict ON public.factchecks(verdict);
CREATE INDEX IF NOT EXISTS idx_factchecks_category ON public.factchecks(category);
CREATE INDEX IF NOT EXISTS idx_factchecks_published ON public.factchecks(is_published);
CREATE INDEX IF NOT EXISTS idx_factchecks_created ON public.factchecks(created_at DESC);

-- =====================================================
-- 4. MÜLL- & SAUBERKEITS-MELDER
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cleanliness_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Typ
    report_type TEXT NOT NULL, -- 'litter', 'illegal_dump', 'graffiti', 'vandalism', 'broken', 'other'

    -- Beschreibung
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Bilder (wichtig für Dokumentation)
    images TEXT[],

    -- Ort
    location_description TEXT NOT NULL, -- z.B. "Am Spielplatz Friedensaue"
    street TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Melder
    reporter_id UUID,
    reporter_name TEXT,
    reporter_email TEXT,
    reporter_phone TEXT,
    anonymous BOOLEAN DEFAULT false,

    -- Status & Bearbeitung
    status TEXT DEFAULT 'new', -- 'new', 'acknowledged', 'in_progress', 'resolved', 'rejected'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Bearbeitung durch Gemeinde/Admin
    assigned_to TEXT,
    admin_notes TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,

    -- Referenz an Behörde
    forwarded_to TEXT, -- z.B. "Gemeindeverwaltung", "Ordnungsamt"
    forwarded_at TIMESTAMPTZ,
    reference_number TEXT, -- Aktenzeichen

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleanliness_reports_type ON public.cleanliness_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_cleanliness_reports_status ON public.cleanliness_reports(status);
CREATE INDEX IF NOT EXISTS idx_cleanliness_reports_created ON public.cleanliness_reports(created_at DESC);

-- Report-Typen für Dropdown
CREATE TABLE IF NOT EXISTS public.cleanliness_report_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_name_en TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO public.cleanliness_report_types (name, display_name, display_name_en, icon, color, sort_order) VALUES
    ('litter', 'Müll / Abfall', 'Litter / Waste', 'trash-2', '#F59E0B', 1),
    ('illegal_dump', 'Illegale Müllablagerung', 'Illegal dumping', 'alert-triangle', '#DC2626', 2),
    ('graffiti', 'Graffiti / Schmiererei', 'Graffiti', 'pen-tool', '#8B5CF6', 3),
    ('vandalism', 'Vandalismus', 'Vandalism', 'alert-octagon', '#EF4444', 4),
    ('broken', 'Defekte Infrastruktur', 'Broken infrastructure', 'tool', '#6366F1', 5),
    ('green_area', 'Grünflächen-Problem', 'Green area issue', 'trees', '#10B981', 6),
    ('street', 'Straßenschaden', 'Street damage', 'construction', '#F97316', 7),
    ('lighting', 'Beleuchtung defekt', 'Broken lighting', 'lightbulb-off', '#3B82F6', 8),
    ('other', 'Sonstiges', 'Other', 'more-horizontal', '#6B7280', 9)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. FORUM ERWEITERN
-- =====================================================

-- Forum Kategorien (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_name_en TEXT,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.forum_categories (name, display_name, description, icon, color, sort_order) VALUES
    ('general', 'Allgemeines', 'Allgemeine Diskussionen rund um Zernsdorf', 'message-circle', '#3B82F6', 1),
    ('neighborhood', 'Nachbarschaft', 'Nachbarschaftsthemen und lokale Anliegen', 'home', '#10B981', 2),
    ('events', 'Veranstaltungen', 'Diskussionen zu lokalen Events', 'calendar', '#8B5CF6', 3),
    ('recommendations', 'Empfehlungen', 'Tipps und Empfehlungen für die Region', 'star', '#F59E0B', 4),
    ('questions', 'Fragen & Antworten', 'Fragen an die Community', 'help-circle', '#EC4899', 5),
    ('announcements', 'Ankündigungen', 'Wichtige Mitteilungen', 'megaphone', '#DC2626', 6),
    ('marketplace', 'Marktplatz', 'Kaufen, Verkaufen, Tauschen', 'shopping-bag', '#6366F1', 7),
    ('offtopic', 'Off-Topic', 'Alles andere', 'coffee', '#6B7280', 8)
ON CONFLICT (name) DO NOTHING;

-- Forum Posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,

    -- Autor
    author_id UUID,
    author_name TEXT NOT NULL,

    -- Inhalt
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Antwort auf (für Thread-Struktur)
    parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,

    -- Medien
    images TEXT[],

    -- Status
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Statistiken
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,

    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    moderated_by UUID,
    moderation_note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON public.forum_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at DESC);

-- =====================================================
-- 6. UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS set_bulletin_posts_updated_at ON public.bulletin_posts;
CREATE TRIGGER set_bulletin_posts_updated_at
    BEFORE UPDATE ON public.bulletin_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_pet_alerts_updated_at ON public.pet_alerts;
CREATE TRIGGER set_pet_alerts_updated_at
    BEFORE UPDATE ON public.pet_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_factchecks_updated_at ON public.factchecks;
CREATE TRIGGER set_factchecks_updated_at
    BEFORE UPDATE ON public.factchecks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_cleanliness_reports_updated_at ON public.cleanliness_reports;
CREATE TRIGGER set_cleanliness_reports_updated_at
    BEFORE UPDATE ON public.cleanliness_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_forum_posts_updated_at ON public.forum_posts;
CREATE TRIGGER set_forum_posts_updated_at
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Bulletin Posts
ALTER TABLE public.bulletin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulletin_categories_select" ON public.bulletin_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "bulletin_posts_select" ON public.bulletin_posts
    FOR SELECT USING (is_active = true);

CREATE POLICY "bulletin_posts_insert" ON public.bulletin_posts
    FOR INSERT WITH CHECK (true);

-- Pet Alerts
ALTER TABLE public.pet_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_alerts_select" ON public.pet_alerts
    FOR SELECT USING (status != 'expired');

CREATE POLICY "pet_alerts_insert" ON public.pet_alerts
    FOR INSERT WITH CHECK (true);

-- Factchecks
ALTER TABLE public.factchecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factchecks_select" ON public.factchecks
    FOR SELECT USING (is_published = true);

-- Cleanliness Reports
ALTER TABLE public.cleanliness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanliness_report_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cleanliness_report_types_select" ON public.cleanliness_report_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "cleanliness_reports_select" ON public.cleanliness_reports
    FOR SELECT USING (true);

CREATE POLICY "cleanliness_reports_insert" ON public.cleanliness_reports
    FOR INSERT WITH CHECK (true);

-- Forum
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_categories_select" ON public.forum_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "forum_posts_select" ON public.forum_posts
    FOR SELECT USING (is_active = true AND is_approved = true);

CREATE POLICY "forum_posts_insert" ON public.forum_posts
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FERTIG!
-- =====================================================
