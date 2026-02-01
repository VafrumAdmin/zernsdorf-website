-- Migration 008: Bildfelder für business_suggestions
-- Logo und Galeriebilder für Vorschläge

-- Bildfelder zur business_suggestions Tabelle hinzufügen
ALTER TABLE public.business_suggestions
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS pending_images TEXT[];

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.business_suggestions.logo_url IS 'URL des hochgeladenen Logos';
COMMENT ON COLUMN public.business_suggestions.pending_images IS 'Array von URLs der hochgeladenen Galeriebilder';
