-- =====================================================
-- ZernsdorfConnect - Event Suggestions System
-- Migration 016
-- =====================================================

-- =====================================================
-- 1. EXTEND EVENTS TABLE
-- =====================================================

-- Add new columns to events table for business linking and event types
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS location_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organizer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add index for business lookups
CREATE INDEX IF NOT EXISTS idx_events_location_business ON public.events(location_business_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_business ON public.events(organizer_business_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);

-- =====================================================
-- 2. EVENT SUGGESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.event_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event-Grunddaten
    title VARCHAR(255) NOT NULL,
    description TEXT,
    description_en TEXT,
    event_type VARCHAR(20) DEFAULT 'single',  -- 'single' | 'recurring'
    category VARCHAR(20) DEFAULT 'community',

    -- Datum & Zeit
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,

    -- Wiederholung (für Kurse)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,           -- RRULE: "FREQ=WEEKLY;BYDAY=MO,WE"
    recurrence_end_date DATE,

    -- Ort (Freitext ODER Business-Verknüpfung)
    location_name VARCHAR(255),
    location_address TEXT,
    location_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Veranstalter (Freitext ODER Business-Verknüpfung)
    organizer_name VARCHAR(255),
    organizer_contact_email VARCHAR(255),
    organizer_contact_phone VARCHAR(50),
    organizer_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,

    -- Bilder
    image_url TEXT,                 -- Hauptbild/Plakat
    images TEXT[],                  -- Weitere Bilder

    -- Kontakt & Links
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Teilnahme (optional)
    requires_registration BOOLEAN DEFAULT false,
    max_participants INTEGER,
    registration_url TEXT,

    -- Vorschlag-Status
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    submitted_by_name VARCHAR(255),
    submitted_by_email VARCHAR(255),
    submitted_by_phone VARCHAR(50),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_suggestions_status ON public.event_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_event_suggestions_start_date ON public.event_suggestions(start_date);
CREATE INDEX IF NOT EXISTS idx_event_suggestions_category ON public.event_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_event_suggestions_created_at ON public.event_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_suggestions_location_business ON public.event_suggestions(location_business_id);
CREATE INDEX IF NOT EXISTS idx_event_suggestions_organizer_business ON public.event_suggestions(organizer_business_id);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Updated_at Trigger for event_suggestions
DROP TRIGGER IF EXISTS set_event_suggestions_updated_at ON public.event_suggestions;
CREATE TRIGGER set_event_suggestions_updated_at
    BEFORE UPDATE ON public.event_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. VIEWS
-- =====================================================

-- Event suggestions with business info
CREATE OR REPLACE VIEW public.event_suggestions_with_businesses AS
SELECT
    es.*,
    lb.name AS location_business_name,
    lb.street AS location_business_street,
    lb.house_number AS location_business_house_number,
    lb.postal_code AS location_business_postal_code,
    lb.city AS location_business_city,
    lb.phone AS location_business_phone,
    lb.email AS location_business_email,
    ob.name AS organizer_business_name,
    ob.phone AS organizer_business_phone,
    ob.email AS organizer_business_email,
    ob.website AS organizer_business_website
FROM public.event_suggestions es
LEFT JOIN public.businesses lb ON es.location_business_id = lb.id
LEFT JOIN public.businesses ob ON es.organizer_business_id = ob.id;

-- Events with business info (extended view)
CREATE OR REPLACE VIEW public.events_with_businesses AS
SELECT
    e.*,
    lb.name AS location_business_name,
    lb.street AS location_business_street,
    lb.house_number AS location_business_house_number,
    lb.postal_code AS location_business_postal_code,
    lb.city AS location_business_city,
    ob.name AS organizer_business_name,
    ob.phone AS organizer_business_phone,
    ob.email AS organizer_business_email,
    ob.website AS organizer_business_website
FROM public.events e
LEFT JOIN public.businesses lb ON e.location_business_id = lb.id
LEFT JOIN public.businesses ob ON e.organizer_business_id = ob.id;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

-- Public can insert suggestions
CREATE POLICY "Anyone can submit event suggestions"
    ON public.event_suggestions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Public can view their own suggestions by email (limited)
CREATE POLICY "Users can view own suggestions"
    ON public.event_suggestions
    FOR SELECT
    TO public
    USING (true);  -- For now, allow read access (admin dashboard needs this)

-- Admin can do everything
CREATE POLICY "Admins can manage event suggestions"
    ON public.event_suggestions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin', 'moderator')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin', 'moderator')
        )
    );

-- =====================================================
-- 6. HELPER FUNCTION: Approve Event Suggestion
-- =====================================================

CREATE OR REPLACE FUNCTION approve_event_suggestion(suggestion_id UUID)
RETURNS UUID AS $$
DECLARE
    suggestion RECORD;
    new_event_id UUID;
BEGIN
    -- Get the suggestion
    SELECT * INTO suggestion FROM public.event_suggestions WHERE id = suggestion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event suggestion not found';
    END IF;

    IF suggestion.status != 'pending' THEN
        RAISE EXCEPTION 'Event suggestion is not pending';
    END IF;

    -- Create the event from the suggestion
    INSERT INTO public.events (
        title,
        description,
        description_en,
        start_date,
        start_time,
        end_date,
        end_time,
        is_all_day,
        location_name,
        location_address,
        location_business_id,
        latitude,
        longitude,
        category,
        organizer_name,
        organizer_business_id,
        contact_email,
        contact_phone,
        website,
        image_url,
        images,
        is_recurring,
        recurrence_rule,
        event_type,
        recurrence_end_date,
        requires_registration,
        max_participants,
        registration_url,
        is_active,
        created_by
    ) VALUES (
        suggestion.title,
        suggestion.description,
        suggestion.description_en,
        suggestion.start_date,
        suggestion.start_time,
        suggestion.end_date,
        suggestion.end_time,
        suggestion.is_all_day,
        COALESCE(suggestion.location_name, (SELECT name FROM public.businesses WHERE id = suggestion.location_business_id)),
        COALESCE(suggestion.location_address, (SELECT CONCAT(street, ' ', house_number, ', ', postal_code, ' ', city) FROM public.businesses WHERE id = suggestion.location_business_id)),
        suggestion.location_business_id,
        suggestion.latitude,
        suggestion.longitude,
        suggestion.category,
        COALESCE(suggestion.organizer_name, (SELECT name FROM public.businesses WHERE id = suggestion.organizer_business_id)),
        suggestion.organizer_business_id,
        COALESCE(suggestion.contact_email, suggestion.organizer_contact_email),
        COALESCE(suggestion.contact_phone, suggestion.organizer_contact_phone),
        suggestion.website,
        suggestion.image_url,
        suggestion.images,
        suggestion.is_recurring,
        suggestion.recurrence_rule,
        suggestion.event_type,
        suggestion.recurrence_end_date,
        suggestion.requires_registration,
        suggestion.max_participants,
        suggestion.registration_url,
        true,
        auth.uid()
    ) RETURNING id INTO new_event_id;

    -- Update the suggestion status
    UPDATE public.event_suggestions
    SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid()
    WHERE id = suggestion_id;

    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMMENT
-- =====================================================

COMMENT ON TABLE public.event_suggestions IS 'Public event suggestions that need admin approval before being published as events';
COMMENT ON FUNCTION approve_event_suggestion IS 'Approves an event suggestion and creates a new event from it';
