-- Migration 007: Messenger-Felder für Businesses
-- WhatsApp, Telegram, Signal für Kontaktmöglichkeiten

-- Messenger-Felder zur businesses Tabelle hinzufügen
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS has_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_telegram BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_signal BOOLEAN DEFAULT false;

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.businesses.has_whatsapp IS 'Ob das Unternehmen über WhatsApp erreichbar ist';
COMMENT ON COLUMN public.businesses.has_telegram IS 'Ob das Unternehmen über Telegram erreichbar ist';
COMMENT ON COLUMN public.businesses.has_signal IS 'Ob das Unternehmen über Signal erreichbar ist';
