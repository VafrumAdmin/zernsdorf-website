import { Link } from '@/i18n/navigation';

// Dieses Layout wird vom Hauptlayout eingeschlossen,
// das bereits NextIntlClientProvider und die Basis-HTML-Struktur bereitstellt.
// Wir fügen nur den minimalen Footer für Impressum + Datenschutz hinzu.

export default async function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Kein Header - nur der Inhalt */}
      <main className="flex-1">{children}</main>

      {/* Minimaler Footer nur mit Impressum + Datenschutz */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-6 text-sm text-slate-400">
            <Link
              href="/imprint"
              className="hover:text-white transition-colors"
            >
              Impressum
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Datenschutz
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
