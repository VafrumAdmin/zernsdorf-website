-- =====================================================
-- Migration: Business Suggestions System
-- Version: 006
-- Description: Adds a business suggestions table for public submissions
-- =====================================================

-- Tabelle für Business-Vorschläge von der Öffentlichkeit
CREATE TABLE IF NOT EXISTS business_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business-Felder (entspricht businesses-Tabelle)
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
  description TEXT,
  street VARCHAR(255),
  house_number VARCHAR(20),
  postal_code VARCHAR(10) DEFAULT '15712',
  city VARCHAR(100) DEFAULT 'Zernsdorf',
  location VARCHAR(100) DEFAULT 'Zernsdorf',
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  opening_hours JSONB,
  opening_hours_text TEXT,
  tags TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Vorschlag-spezifische Felder
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by_name VARCHAR(255),
  submitted_by_email VARCHAR(255),
  submitted_by_phone VARCHAR(50),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON business_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON business_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON business_suggestions(category_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_business_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_suggestions_updated_at ON business_suggestions;
CREATE TRIGGER trigger_update_business_suggestions_updated_at
  BEFORE UPDATE ON business_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_business_suggestions_updated_at();

-- RLS aktivieren
ALTER TABLE business_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann Vorschläge erstellen (für öffentliches Formular)
DROP POLICY IF EXISTS "Anyone can create suggestions" ON business_suggestions;
CREATE POLICY "Anyone can create suggestions"
  ON business_suggestions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Nur Admins können Vorschläge lesen
DROP POLICY IF EXISTS "Admins can read all suggestions" ON business_suggestions;
CREATE POLICY "Admins can read all suggestions"
  ON business_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Nur Admins können Vorschläge aktualisieren
DROP POLICY IF EXISTS "Admins can update suggestions" ON business_suggestions;
CREATE POLICY "Admins can update suggestions"
  ON business_suggestions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Nur Admins können Vorschläge löschen
DROP POLICY IF EXISTS "Admins can delete suggestions" ON business_suggestions;
CREATE POLICY "Admins can delete suggestions"
  ON business_suggestions
  FOR DELETE
  TO authenticated
  USING (true);

-- Kommentar zur Tabelle
COMMENT ON TABLE business_suggestions IS 'Öffentliche Vorschläge für neue Einträge im Branchenverzeichnis, die von Admins geprüft werden';
COMMENT ON COLUMN business_suggestions.status IS 'pending: Wartet auf Prüfung, approved: Freigegeben und in businesses kopiert, rejected: Abgelehnt';
