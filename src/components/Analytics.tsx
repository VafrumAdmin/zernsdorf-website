'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { DeviceType } from '@/types/database';

// =====================================================
// KONFIGURATION
// =====================================================
const HEARTBEAT_INTERVAL = 30000; // 30 Sekunden
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten
const STORAGE_KEY_VISITOR = 'zc_visitor_id';
const STORAGE_KEY_SESSION = 'zc_session_id';
const STORAGE_KEY_LAST_ACTIVITY = 'zc_last_activity';

// =====================================================
// HILFSFUNKTIONEN
// =====================================================

/**
 * Generiert eine eindeutige Besucher-ID basierend auf Browser-Fingerprint
 * DSGVO-konform: Keine persönlichen Daten, nur technische Merkmale
 */
function generateVisitorId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let fingerprint = '';

  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('ZernsdorfConnect', 2, 2);
    fingerprint = canvas.toDataURL().slice(-50);
  }

  // Kombiniere mit anderen Faktoren
  const factors = [
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    fingerprint,
  ].join('|');

  // Einfacher Hash
  let hash = 0;
  for (let i = 0; i < factors.length; i++) {
    const char = factors.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return 'v_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}

/**
 * Generiert eine Session-ID
 */
function generateSessionId(): string {
  return 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Erkennt den Gerätetyp
 */
function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Berechnet die Scroll-Tiefe in Prozent
 */
function calculateScrollDepth(): number {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  if (scrollHeight <= 0) return 100;

  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

/**
 * Prüft ob Do Not Track aktiviert ist
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  const dnt =
    navigator.doNotTrack ||
    (window as Window & { doNotTrack?: string }).doNotTrack ||
    (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack;

  return dnt === '1' || dnt === 'yes';
}

// =====================================================
// ANALYTICS KOMPONENTE
// =====================================================

export function Analytics() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxScrollDepthRef = useRef<number>(0);
  const pageStartTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string | null>(null);

  // =====================================================
  // TRACKING-FUNKTIONEN
  // =====================================================

  const sendTrackEvent = useCallback(
    async (
      type: 'pageview' | 'session_start' | 'session_end',
      data: Record<string, unknown> = {}
    ) => {
      if (!visitorIdRef.current) return;

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            visitor_id: visitorIdRef.current,
            session_id: sessionIdRef.current,
            page_path: pathname,
            page_title: document.title,
            referrer: document.referrer || undefined,
            user_agent: navigator.userAgent,
            device_type: detectDeviceType(),
            ...data,
          }),
          // Beacon-Modus für session_end
          ...(type === 'session_end' && { keepalive: true }),
        });
      } catch {
        // Fehler still ignorieren - Analytics sollte die UX nicht beeinträchtigen
      }
    },
    [pathname]
  );

  const sendHeartbeat = useCallback(async () => {
    if (!visitorIdRef.current || !sessionIdRef.current) return;

    try {
      const response = await fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: visitorIdRef.current,
          session_id: sessionIdRef.current,
          page_path: pathname,
          scroll_depth: maxScrollDepthRef.current,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session_id) {
          sessionIdRef.current = data.session_id;
          localStorage.setItem(STORAGE_KEY_SESSION, data.session_id);
        }
      }
    } catch {
      // Fehler still ignorieren
    }

    // Letzte Aktivität aktualisieren
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
  }, [pathname]);

  // =====================================================
  // SESSION-MANAGEMENT
  // =====================================================

  const initializeSession = useCallback(() => {
    // DNT respektieren
    if (isDoNotTrackEnabled()) {
      return false;
    }

    // Besucher-ID holen oder erstellen
    let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
    const isReturning = !!visitorId;

    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
    }

    visitorIdRef.current = visitorId;

    // Session prüfen
    const lastActivity = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    const lastActivityTime = lastActivity ? parseInt(lastActivity, 10) : 0;
    const timeSinceLastActivity = Date.now() - lastActivityTime;

    let sessionId = localStorage.getItem(STORAGE_KEY_SESSION);

    // Neue Session wenn keine existiert oder Timeout überschritten
    if (!sessionId || timeSinceLastActivity > SESSION_TIMEOUT) {
      sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);

      // Session-Start tracken
      sendTrackEvent('session_start', { is_returning: isReturning });
    }

    sessionIdRef.current = sessionId;
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());

    return true;
  }, [sendTrackEvent]);

  // =====================================================
  // SCROLL-TRACKING
  // =====================================================

  useEffect(() => {
    const handleScroll = () => {
      const depth = calculateScrollDepth();
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // =====================================================
  // INITIALISIERUNG UND PAGE TRACKING
  // =====================================================

  useEffect(() => {
    // Admin-Bereich nicht tracken
    if (pathname?.includes('/admin')) {
      return;
    }

    // Session initialisieren
    const initialized = initializeSession();
    if (!initialized) return;

    // Nur tracken wenn sich der Pfad geändert hat
    if (lastPathRef.current !== pathname) {
      // Vorherige Seite: Zeit berechnen (wenn es eine gab)
      if (lastPathRef.current !== null) {
        const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
        // Optional: Zeit für vorherige Seite speichern
        sendTrackEvent('pageview', {
          page_path: lastPathRef.current,
          time_on_page: timeOnPage,
          scroll_depth: maxScrollDepthRef.current,
        });
      }

      // Neue Seite
      lastPathRef.current = pathname;
      pageStartTimeRef.current = Date.now();
      maxScrollDepthRef.current = 0;

      // Pageview tracken
      sendTrackEvent('pageview');
    }

    // Heartbeat starten
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [pathname, initializeSession, sendTrackEvent, sendHeartbeat]);

  // =====================================================
  // CLEANUP BEI VERLASSEN
  // =====================================================

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Session-Ende mit Beacon API senden
      if (visitorIdRef.current && sessionIdRef.current) {
        const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000);

        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            type: 'session_end',
            visitor_id: visitorIdRef.current,
            session_id: sessionIdRef.current,
            page_path: pathname,
            scroll_depth: maxScrollDepthRef.current,
            time_on_page: timeOnPage,
          })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Letzte Aktivität speichern
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // Diese Komponente rendert nichts
  return null;
}

export default Analytics;
