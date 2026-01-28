'use client';

import { Link } from '@/i18n/navigation';
import { Trees, Facebook, Instagram } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { CookieSettingsButton } from '@/components/cookie';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
                <Trees className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ZernsdorfConnect</span>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              Ihr digitales Tor zu allem, was in Zernsdorf wichtig ist.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4 text-white">
              Schnellzugriff
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Startseite' },
                { href: '/listings', label: 'Branchenverzeichnis' },
                { href: '/events', label: 'Veranstaltungen' },
                { href: '/waste', label: 'Abfallkalender' },
                { href: '/history', label: 'Geschichte' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-slate-400 hover:${theme.primary} transition-colors`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-white">
              Services
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/transport', label: 'ÖPNV & Fahrpläne' },
                { href: '/weather', label: 'Wetter' },
                { href: '/map', label: 'Interaktive Karte' },
                { href: '/report', label: 'Mängelmelder' },
                { href: '/bulletin', label: 'Schwarzes Brett' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ZernsdorfConnect. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/imprint" className="hover:text-white transition-colors">
              Impressum
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Datenschutz
            </Link>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
