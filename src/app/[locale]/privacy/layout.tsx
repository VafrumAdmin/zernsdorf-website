import { Link } from '@/i18n/navigation';
import { getMaintenanceStatus } from '@/lib/admin/maintenance';

export default async function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenanceStatus = await getMaintenanceStatus();

  // Im Wartungsmodus: Minimaler Footer mit Zurück-Link
  if (maintenanceStatus.enabled) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 border-t border-slate-800 py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center gap-6 text-sm text-slate-400">
              <Link
                href="/maintenance"
                className="hover:text-white transition-colors"
              >
                ← Zurück
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/imprint"
                className="hover:text-white transition-colors"
              >
                Impressum
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/privacy"
                className="text-white"
              >
                Datenschutz
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Normaler Modus: Nur children (Header/Footer kommen vom Hauptlayout)
  return <>{children}</>;
}
