'use client';

import { Settings } from 'lucide-react';
import { openCookieSettings } from './CookieConsent';

export function CookieSettingsButton() {
  return (
    <button
      onClick={openCookieSettings}
      className="hover:text-white transition-colors inline-flex items-center gap-1"
    >
      Cookie-Einstellungen
    </button>
  );
}
