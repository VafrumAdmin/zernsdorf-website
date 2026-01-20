'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

const defaultPreferences: CookiePreferences = {
  necessary: true, // Immer aktiviert
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Prüfen ob Consent bereits gegeben wurde
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Kleine Verzögerung für bessere UX
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    } else {
      // Gespeicherte Präferenzen laden
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);

    // Event auslösen für andere Komponenten
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: prefs }));
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const acceptNecessaryOnly = () => {
    savePreferences(defaultPreferences);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Notwendige können nicht deaktiviert werden
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Banner */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Cookie-Einstellungen
              </h2>
              <p className="text-sm text-emerald-100">
                Wir respektieren Ihre Privatsphäre
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.
            Sie können selbst entscheiden, welche Kategorien Sie zulassen möchten.
          </p>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Weniger anzeigen' : 'Cookie-Details anzeigen'}
          </button>

          {/* Cookie Categories */}
          {showDetails && (
            <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-xl">
              {/* Notwendige Cookies */}
              <div className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">Notwendige Cookies</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Erforderlich
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                    Sie speichern z.B. Ihre Cookie-Einstellungen.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-emerald-600 rounded-full"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform translate-x-5"></div>
                </label>
              </div>

              {/* Funktionale Cookies */}
              <div className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Funktionale Cookies</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Diese Cookies ermöglichen erweiterte Funktionen wie Ihre Adress-Einstellungen für den Müllkalender
                    und personalisierte Inhalte.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={() => togglePreference('functional')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-checked:bg-emerald-600 rounded-full transition-colors"></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.functional ? 'translate-x-5' : ''}`}></div>
                </label>
              </div>

              {/* Analyse Cookies */}
              <div className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Analyse Cookies</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                    Alle Daten werden anonymisiert erfasst.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => togglePreference('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-checked:bg-emerald-600 rounded-full transition-colors"></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.analytics ? 'translate-x-5' : ''}`}></div>
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Marketing Cookies</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen.
                    Derzeit verwenden wir keine Marketing-Cookies.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => togglePreference('marketing')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-checked:bg-emerald-600 rounded-full transition-colors"></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.marketing ? 'translate-x-5' : ''}`}></div>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={acceptNecessaryOnly}
              variant="outline"
              className="flex-1 border-slate-300 hover:bg-slate-100"
            >
              Nur Notwendige
            </Button>
            {showDetails && (
              <Button
                onClick={saveCustomPreferences}
                variant="secondary"
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Auswahl speichern
              </Button>
            )}
            <Button
              onClick={acceptAll}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Alle akzeptieren
            </Button>
          </div>

          {/* Privacy Link */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Mehr Informationen finden Sie in unserer{' '}
            <a href="/privacy" className="text-emerald-600 hover:underline">
              Datenschutzerklärung
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook zum Abrufen der Cookie-Einstellungen
export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const loadPreferences = () => {
      const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    };

    loadPreferences();

    // Auf Änderungen hören
    const handleChange = (e: CustomEvent<CookiePreferences>) => {
      setPreferences(e.detail);
    };

    window.addEventListener('cookieConsentChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('cookieConsentChanged', handleChange as EventListener);
    };
  }, []);

  return preferences;
}

// Funktion zum erneuten Öffnen des Cookie-Banners
export function openCookieSettings() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.location.reload();
}
