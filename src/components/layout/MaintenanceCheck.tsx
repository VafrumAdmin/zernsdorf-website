import { redirect } from 'next/navigation';
import { shouldShowMaintenancePage } from '@/lib/admin/maintenance';
import { headers } from 'next/headers';

interface MaintenanceCheckProps {
  children: React.ReactNode;
  locale: string;
}

export async function MaintenanceCheck({ children, locale }: MaintenanceCheckProps) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

  // Ausgeschlossene Pfade
  const excludedPaths = ['/admin', '/maintenance', '/api'];
  const isExcluded = excludedPaths.some(path => pathname.includes(path));

  if (!isExcluded) {
    const showMaintenance = await shouldShowMaintenancePage();
    if (showMaintenance) {
      redirect(`/${locale}/maintenance`);
    }
  }

  return <>{children}</>;
}
