-- =====================================================
-- Analytics System für ZernsdorfConnect
-- Migration: 009_analytics.sql
-- =====================================================

-- =====================================================
-- BESUCHER-SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,           -- Anonymer Fingerprint (kein Cookie)
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,                   -- 'desktop', 'mobile', 'tablet'
  country TEXT,
  city TEXT,
  is_returning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEITENAUFRUFE
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,            -- z.B. '/de/mobility'
  page_title TEXT,
  time_on_page INTEGER DEFAULT 0,     -- Sekunden
  scroll_depth INTEGER DEFAULT 0,     -- Prozent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TÄGLICHE AGGREGATE (für schnelle Abfragen)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  unique_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  total_pageviews INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  top_pages JSONB,                    -- [{path, views, title}]
  device_breakdown JSONB,             -- {desktop: x, mobile: y, tablet: z}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ECHTZEIT-BESUCHER TRACKING (aktive Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id UUID REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  current_page TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDIZES FÜR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON analytics_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_session_start ON analytics_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON analytics_pageviews(page_path);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON analytics_pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_date ON analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_realtime_last_activity ON analytics_realtime(last_activity);
CREATE INDEX IF NOT EXISTS idx_realtime_visitor ON analytics_realtime(visitor_id);

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_realtime ENABLE ROW LEVEL SECURITY;

-- Service Role kann alles (für API-Zugriff)
DROP POLICY IF EXISTS "Service role has full access to analytics_sessions" ON analytics_sessions;
CREATE POLICY "Service role has full access to analytics_sessions"
  ON analytics_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to analytics_pageviews" ON analytics_pageviews;
CREATE POLICY "Service role has full access to analytics_pageviews"
  ON analytics_pageviews FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to analytics_daily" ON analytics_daily;
CREATE POLICY "Service role has full access to analytics_daily"
  ON analytics_daily FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to analytics_realtime" ON analytics_realtime;
CREATE POLICY "Service role has full access to analytics_realtime"
  ON analytics_realtime FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNKTION: Alte Analytics-Daten löschen (DSGVO - 90 Tage)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Lösche Sessions älter als 90 Tage
  DELETE FROM analytics_sessions
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Lösche Pageviews älter als 90 Tage (Cascade sollte greifen, aber sicherheitshalber)
  DELETE FROM analytics_pageviews
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Lösche inaktive Realtime-Einträge (älter als 5 Minuten)
  DELETE FROM analytics_realtime
  WHERE last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNKTION: Tägliche Aggregation berechnen
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
DECLARE
  v_unique_visitors INTEGER;
  v_returning_visitors INTEGER;
  v_new_visitors INTEGER;
  v_total_pageviews INTEGER;
  v_avg_duration INTEGER;
  v_bounce_rate DECIMAL(5,2);
  v_top_pages JSONB;
  v_device_breakdown JSONB;
BEGIN
  -- Einzigartige Besucher
  SELECT COUNT(DISTINCT visitor_id) INTO v_unique_visitors
  FROM analytics_sessions
  WHERE DATE(session_start) = target_date;

  -- Wiederkehrende Besucher
  SELECT COUNT(DISTINCT visitor_id) INTO v_returning_visitors
  FROM analytics_sessions
  WHERE DATE(session_start) = target_date AND is_returning = true;

  -- Neue Besucher
  v_new_visitors := v_unique_visitors - v_returning_visitors;

  -- Gesamte Seitenaufrufe
  SELECT COUNT(*) INTO v_total_pageviews
  FROM analytics_pageviews
  WHERE DATE(created_at) = target_date;

  -- Durchschnittliche Session-Dauer
  SELECT COALESCE(AVG(duration_seconds), 0)::INTEGER INTO v_avg_duration
  FROM analytics_sessions
  WHERE DATE(session_start) = target_date AND duration_seconds > 0;

  -- Bounce Rate (Sessions mit nur 1 Pageview)
  SELECT COALESCE(
    (COUNT(CASE WHEN page_views = 1 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
    0
  ) INTO v_bounce_rate
  FROM analytics_sessions
  WHERE DATE(session_start) = target_date;

  -- Top Seiten
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('path', page_path, 'views', views, 'title', page_title)
  ), '[]'::jsonb) INTO v_top_pages
  FROM (
    SELECT page_path, page_title, COUNT(*) as views
    FROM analytics_pageviews
    WHERE DATE(created_at) = target_date
    GROUP BY page_path, page_title
    ORDER BY views DESC
    LIMIT 10
  ) top;

  -- Geräte-Verteilung
  SELECT jsonb_build_object(
    'desktop', COALESCE(SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END), 0),
    'mobile', COALESCE(SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END), 0),
    'tablet', COALESCE(SUM(CASE WHEN device_type = 'tablet' THEN 1 ELSE 0 END), 0)
  ) INTO v_device_breakdown
  FROM analytics_sessions
  WHERE DATE(session_start) = target_date;

  -- Upsert in analytics_daily
  INSERT INTO analytics_daily (
    date,
    unique_visitors,
    returning_visitors,
    new_visitors,
    total_pageviews,
    avg_session_duration,
    bounce_rate,
    top_pages,
    device_breakdown
  ) VALUES (
    target_date,
    v_unique_visitors,
    v_returning_visitors,
    v_new_visitors,
    v_total_pageviews,
    v_avg_duration,
    v_bounce_rate,
    v_top_pages,
    v_device_breakdown
  )
  ON CONFLICT (date) DO UPDATE SET
    unique_visitors = EXCLUDED.unique_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    new_visitors = EXCLUDED.new_visitors,
    total_pageviews = EXCLUDED.total_pageviews,
    avg_session_duration = EXCLUDED.avg_session_duration,
    bounce_rate = EXCLUDED.bounce_rate,
    top_pages = EXCLUDED.top_pages,
    device_breakdown = EXCLUDED.device_breakdown;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Aktuelle Echtzeit-Besucher (letzte 5 Minuten)
-- =====================================================
CREATE OR REPLACE VIEW analytics_current_visitors AS
SELECT
  COUNT(DISTINCT visitor_id) as active_visitors,
  jsonb_agg(DISTINCT current_page) FILTER (WHERE current_page IS NOT NULL) as active_pages,
  jsonb_build_object(
    'desktop', COUNT(CASE WHEN device_type = 'desktop' THEN 1 END),
    'mobile', COUNT(CASE WHEN device_type = 'mobile' THEN 1 END),
    'tablet', COUNT(CASE WHEN device_type = 'tablet' THEN 1 END)
  ) as device_breakdown
FROM analytics_realtime
WHERE last_activity > NOW() - INTERVAL '5 minutes';

-- =====================================================
-- KOMMENTARE
-- =====================================================
COMMENT ON TABLE analytics_sessions IS 'Speichert anonyme Besucher-Sessions für Analytics';
COMMENT ON TABLE analytics_pageviews IS 'Speichert einzelne Seitenaufrufe mit Verweildauer und Scroll-Tiefe';
COMMENT ON TABLE analytics_daily IS 'Aggregierte tägliche Statistiken für schnelle Dashboard-Abfragen';
COMMENT ON TABLE analytics_realtime IS 'Echtzeit-Tracking für aktive Besucher';
COMMENT ON FUNCTION cleanup_old_analytics() IS 'DSGVO-konforme Löschung alter Analytics-Daten (90 Tage)';
COMMENT ON FUNCTION calculate_daily_analytics(DATE) IS 'Berechnet und speichert tägliche Aggregationen';
