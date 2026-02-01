-- Migration 010: Messenger-Felder für Business Suggestions
-- WhatsApp, Telegram, Signal für Kontaktmöglichkeiten bei Vorschlägen

-- Messenger-Felder zur business_suggestions Tabelle hinzufügen
ALTER TABLE public.business_suggestions
ADD COLUMN IF NOT EXISTS has_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_telegram BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_signal BOOLEAN DEFAULT false;

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.business_suggestions.has_whatsapp IS 'Ob das Unternehmen über WhatsApp erreichbar ist';
COMMENT ON COLUMN public.business_suggestions.has_telegram IS 'Ob das Unternehmen über Telegram erreichbar ist';
COMMENT ON COLUMN public.business_suggestions.has_signal IS 'Ob das Unternehmen über Signal erreichbar ist';
