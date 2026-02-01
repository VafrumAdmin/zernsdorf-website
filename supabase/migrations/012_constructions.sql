-- =====================================================
-- Migration: Constructions (Baustellen) System
-- Version: 007
-- Description: Tables for managing road constructions and closures
-- =====================================================

-- Baustellen-Tabelle
CREATE TABLE IF NOT EXISTS constructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basis-Informationen
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,

  -- Kategorisierung
  type VARCHAR(50) DEFAULT 'road' CHECK (type IN ('road', 'highway', 'rail', 'bridge', 'utility', 'other')),
  category VARCHAR(100), -- z.B. "Zernsdorf", "KW", "A10", "A12", "A13", "Bahn"

  -- Zeitraum
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status: planned, active, completed, cancelled
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),

  -- Auswirkungen
  impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  traffic_impact TEXT, -- z.B. "Halbseitige Sperrung", "Vollsperrung", "Tempolimit 80"
  detour_info TEXT, -- Umleitungsinfos

  -- Koordinaten für Karte
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Quelle
  source VARCHAR(255), -- z.B. "Stadt KW", "Landkreis LDS", "Autobahn GmbH"
  source_url TEXT,
  external_id VARCHAR(100), -- ID von externer Quelle für Duplikat-Erkennung

  -- Automatische Abfrage
  is_auto_fetched BOOLEAN DEFAULT false,
  last_fetched_at TIMESTAMPTZ,

  -- Sichtbarkeit
  is_featured BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_constructions_status ON constructions(status);
CREATE INDEX IF NOT EXISTS idx_constructions_category ON constructions(category);
CREATE INDEX IF NOT EXISTS idx_constructions_dates ON constructions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_constructions_visible ON constructions(is_visible, status);
CREATE INDEX IF NOT EXISTS idx_constructions_external ON constructions(external_id);

-- RLS aktivieren
ALTER TABLE constructions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Jeder kann aktive/geplante Baustellen lesen
DROP POLICY IF EXISTS "Public can read visible constructions" ON constructions;
CREATE POLICY "Public can read visible constructions" ON constructions
  FOR SELECT USING (is_visible = true);

-- Admins können alles
DROP POLICY IF EXISTS "Admins can manage constructions" ON constructions;
CREATE POLICY "Admins can manage constructions" ON constructions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_constructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS constructions_updated_at ON constructions;
CREATE TRIGGER constructions_updated_at
  BEFORE UPDATE ON constructions
  FOR EACH ROW
  EXECUTE FUNCTION update_constructions_updated_at();

-- Tabelle für Quellen-Konfiguration (für automatische Abfrage)
CREATE TABLE IF NOT EXISTS construction_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'website' CHECK (type IN ('website', 'api', 'rss')),
  category VARCHAR(100), -- Welche Kategorie zuweisen
  is_active BOOLEAN DEFAULT true,
  fetch_interval_hours INTEGER DEFAULT 12,
  last_fetched_at TIMESTAMPTZ,
  last_fetch_status VARCHAR(50),
  last_fetch_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Quellen einfügen
INSERT INTO construction_sources (name, url, type, category) VALUES
  ('Stadt Königs Wusterhausen', 'https://www.koenigs-wusterhausen.de/aktuelles', 'website', 'KW'),
  ('Landkreis Dahme-Spreewald', 'https://www.dahme-spreewald.de/de/aktuelles/strassensperrungen-im-landkreis-dahme-spreewald/100414', 'website', 'LDS'),
  ('Baustelleninfo Brandenburg', 'https://www.ls.brandenburg.de/ls/de/bauen/baustelleninformationssystem/', 'website', 'Brandenburg'),
  ('ADAC A10', 'https://www.adac.de/verkehr/verkehrsinformationen/de/a10/', 'website', 'A10'),
  ('ADAC A12', 'https://www.adac.de/verkehr/verkehrsinformationen/de/a12/', 'website', 'A12'),
  ('ADAC A13', 'https://www.adac.de/verkehr/verkehrsinformationen/de/a13/', 'website', 'A13'),
  ('i2030 Bahnprojekte', 'https://www.i2030.de/suedost/', 'website', 'Bahn')
ON CONFLICT DO NOTHING;
