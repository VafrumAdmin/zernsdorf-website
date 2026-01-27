-- =====================================================
-- ZernsdorfConnect - Admin-System & Branchenverzeichnis
-- Migration 002
-- =====================================================

-- =====================================================
-- 1. BUSINESS CATEGORIES (Branchen-Kategorien)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.business_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_name_en TEXT,
    description TEXT,
    icon TEXT, -- Lucide Icon Name
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Kategorien einfügen
INSERT INTO public.business_categories (name, display_name, display_name_en, icon, color, sort_order) VALUES
    ('gastronomy', 'Gastronomie', 'Gastronomy', 'utensils', '#F97316', 1),
    ('health', 'Gesundheit', 'Health', 'heart-pulse', '#EF4444', 2),
    ('retail', 'Gewerbe & Einkaufen', 'Retail & Shopping', 'shopping-bag', '#8B5CF6', 3),
    ('crafts', 'Handwerk', 'Crafts & Services', 'wrench', '#F59E0B', 4),
    ('clubs', 'Vereine', 'Clubs & Organizations', 'users', '#10B981', 5),
    ('leisure', 'Freizeit & Bildung', 'Leisure & Education', 'graduation-cap', '#3B82F6', 6),
    ('services', 'Dienstleistungen', 'Services', 'briefcase', '#6366F1', 7),
    ('emergency', 'Notdienste', 'Emergency Services', 'siren', '#DC2626', 8)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. BUSINESSES (Branchenverzeichnis)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basis-Informationen
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL,
    description TEXT,
    description_en TEXT,

    -- Adresse
    street TEXT,
    house_number TEXT,
    postal_code TEXT DEFAULT '15712',
    city TEXT DEFAULT 'Zernsdorf',
    location TEXT DEFAULT 'Zernsdorf', -- Ortsteil/Region für Filterung

    -- Kontakt
    phone TEXT,
    email TEXT,
    website TEXT,

    -- Öffnungszeiten (strukturiert)
    opening_hours JSONB, -- {"mo": "08:00-18:00", "di": "08:00-18:00", ...}
    opening_hours_text TEXT, -- Freitext-Alternative: "Mo-Fr 8-18 Uhr"

    -- Zusätzliche Infos
    tags TEXT[], -- z.B. ['barrierefrei', 'parkplatz', 'lieferservice']
    images TEXT[], -- Array von Bild-URLs
    logo_url TEXT,

    -- Status & Sichtbarkeit
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false, -- Hervorgehobene Einträge
    is_recommended BOOLEAN DEFAULT false, -- "Empfohlen von Nachbarn"

    -- Sortierung & Position
    sort_order INTEGER DEFAULT 0,

    -- Geodaten (optional für Karte)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Verwaltung
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(location);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- =====================================================
-- 3. TRAFFIC LOCATIONS (Verkehrspunkte)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.traffic_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_short TEXT, -- Kurzname für Dashboard
    description TEXT,
    location_type TEXT DEFAULT 'road', -- road, tunnel, bridge, crossing, construction

    -- Position
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Status
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    show_on_dashboard BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Verkehrspunkte für Zernsdorf
INSERT INTO public.traffic_locations (name, name_short, description, location_type, sort_order, show_on_dashboard) VALUES
    ('Tunnel Storkower Straße', 'Tunnel', 'Unterführung unter der Bahnlinie', 'tunnel', 1, true),
    ('Bahnübergang Zernsdorf', 'Bahnübergang', 'Bahnübergang am Bahnhof Zernsdorf', 'crossing', 2, true),
    ('Segelfliegerdamm', 'Segelfliegerdamm', 'Verbindung nach Senzig', 'road', 3, true),
    ('Karl-Marx-Straße', 'Karl-Marx-Str.', 'Hauptstraße durch Zernsdorf', 'road', 4, false),
    ('Friedensaue', 'Friedensaue', 'Ortszentrum', 'road', 5, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. TRAFFIC STATUS (Verkehrsstatus)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.traffic_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.traffic_locations(id) ON DELETE CASCADE,

    -- Status
    status TEXT NOT NULL DEFAULT 'unknown', -- open, closed, restricted, construction, unknown
    status_level TEXT DEFAULT 'green', -- green, yellow, red, gray

    -- Details
    message TEXT, -- z.B. "Gesperrt wegen Bauarbeiten"
    message_en TEXT,
    reason TEXT, -- construction, accident, event, maintenance

    -- Zeitraum
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- NULL = unbefristet

    -- Quelle & Verwaltung
    source TEXT DEFAULT 'admin', -- admin, api, user_report
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für aktuelle Status-Abfragen
CREATE INDEX IF NOT EXISTS idx_traffic_status_location ON public.traffic_status(location_id);
CREATE INDEX IF NOT EXISTS idx_traffic_status_valid ON public.traffic_status(valid_from, valid_until);

-- =====================================================
-- 5. EVENTS (Veranstaltungen)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basis-Informationen
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    description_en TEXT,

    -- Datum & Zeit
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,

    -- Ort
    location_name TEXT, -- z.B. "Bürgerhaus"
    location_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Kategorisierung
    category TEXT DEFAULT 'general', -- festival, market, sports, culture, community, official

    -- Veranstalter
    organizer_name TEXT,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,

    -- Kontakt
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,

    -- Medien
    image_url TEXT,
    images TEXT[],

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- iCal RRULE Format

    -- Teilnahme
    requires_registration BOOLEAN DEFAULT false,
    max_participants INTEGER,
    registration_url TEXT,

    -- Verwaltung
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- =====================================================
-- 6. ADMIN SETTINGS (Globale Einstellungen)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Einstellungen
INSERT INTO public.admin_settings (key, value, description) VALUES
    ('maintenance_mode', '{"enabled": false, "message": "", "estimated_end": null}', 'Wartungsmodus-Einstellungen'),
    ('site_settings', '{"site_name": "ZernsdorfConnect", "contact_email": "", "show_weather": true, "show_traffic": true, "show_transit": true}', 'Allgemeine Website-Einstellungen'),
    ('traffic_settings', '{"auto_refresh": true, "refresh_interval": 120, "show_construction": true}', 'Verkehrs-Widget Einstellungen'),
    ('directory_settings', '{"items_per_page": 20, "show_inactive": false, "default_location": "Zernsdorf"}', 'Branchenverzeichnis-Einstellungen')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 7. ACTIVITY LOG für Admin-Aktionen
-- =====================================================

-- Erweitere die bestehende activity_log Tabelle um Admin-spezifische Aktionen
-- (Falls die Tabelle schon existiert, wird sie um neue Einträge ergänzt)

-- =====================================================
-- 8. HILFSFUNKTIONEN
-- =====================================================

-- Funktion zum automatischen Generieren von Slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Konvertiere zu Kleinbuchstaben und ersetze Umlaute
    slug := LOWER(input_text);
    slug := REPLACE(slug, 'ä', 'ae');
    slug := REPLACE(slug, 'ö', 'oe');
    slug := REPLACE(slug, 'ü', 'ue');
    slug := REPLACE(slug, 'ß', 'ss');
    -- Ersetze Leerzeichen und Sonderzeichen durch Bindestriche
    slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
    -- Entferne führende/nachfolgende Bindestriche
    slug := TRIM(BOTH '-' FROM slug);
    RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger für automatische Slug-Generierung bei Businesses
CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_business_slug ON public.businesses;
CREATE TRIGGER trigger_set_business_slug
    BEFORE INSERT ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION set_business_slug();

-- Trigger für automatische Slug-Generierung bei Events
CREATE OR REPLACE FUNCTION set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.title) || '-' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_event_slug ON public.events;
CREATE TRIGGER trigger_set_event_slug
    BEFORE INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION set_event_slug();

-- Updated_at Trigger für neue Tabellen
DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_traffic_status_updated_at ON public.traffic_status;
CREATE TRIGGER set_traffic_status_updated_at
    BEFORE UPDATE ON public.traffic_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VIEWS für einfache Abfragen
-- =====================================================

-- Businesses mit Kategorie-Info
CREATE OR REPLACE VIEW public.businesses_with_category AS
SELECT
    b.*,
    bc.name AS category_name,
    bc.display_name AS category_display_name,
    bc.icon AS category_icon,
    bc.color AS category_color
FROM public.businesses b
LEFT JOIN public.business_categories bc ON b.category_id = bc.id;

-- Aktuelle Traffic-Status (nur gültige)
CREATE OR REPLACE VIEW public.current_traffic_status AS
SELECT
    ts.*,
    tl.name AS location_name,
    tl.name_short AS location_short,
    tl.location_type,
    tl.show_on_dashboard
FROM public.traffic_status ts
JOIN public.traffic_locations tl ON ts.location_id = tl.id
WHERE tl.is_active = true
  AND ts.valid_from <= NOW()
  AND (ts.valid_until IS NULL OR ts.valid_until > NOW())
ORDER BY tl.sort_order;

-- Kommende Events
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT *
FROM public.events
WHERE is_active = true
  AND start_date >= CURRENT_DATE
ORDER BY start_date, start_time;

-- =====================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================

-- RLS für businesses (öffentlich lesbar, nur Admins können schreiben)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses sind öffentlich lesbar"
    ON public.businesses FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins können alle Businesses sehen"
    ON public.businesses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins können Businesses erstellen"
    ON public.businesses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins können Businesses bearbeiten"
    ON public.businesses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins können Businesses löschen"
    ON public.businesses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- RLS für Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aktive Events sind öffentlich lesbar"
    ON public.events FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins können alle Events sehen"
    ON public.events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins können Events verwalten"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- RLS für Traffic (öffentlich lesbar)
ALTER TABLE public.traffic_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traffic Locations sind öffentlich lesbar"
    ON public.traffic_locations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Traffic Status ist öffentlich lesbar"
    ON public.traffic_status FOR SELECT
    USING (true);

CREATE POLICY "Admins können Traffic verwalten"
    ON public.traffic_locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins können Traffic Status verwalten"
    ON public.traffic_status FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Admin Settings nur für Admins
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins können Settings lesen"
    ON public.admin_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins können Settings ändern"
    ON public.admin_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Business Categories sind öffentlich lesbar
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business Categories sind öffentlich lesbar"
    ON public.business_categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins können Categories verwalten"
    ON public.business_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );
