import { redirect } from 'next/navigation';
import { getMaintenanceStatus, isAdminLoggedIn } from '@/lib/admin/maintenance';

// Diese Layout gilt für alle öffentlichen Seiten (nicht admin/maintenance)
// und prüft den Wartungsmodus bei jedem Request

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Prüfe Wartungsmodus
  const maintenanceStatus = await getMaintenanceStatus();

  if (maintenanceStatus.enabled) {
    const isAdmin = await isAdminLoggedIn();

    if (!isAdmin) {
      // Leite zur Wartungsseite um
      redirect(`/${locale}/maintenance`);
    }
  }

  return <>{children}</>;
}
