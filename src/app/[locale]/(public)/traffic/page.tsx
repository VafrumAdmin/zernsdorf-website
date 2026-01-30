import { setRequestLocale } from 'next-intl/server';
import { getActiveConstructions, getPlannedConstructions } from '@/lib/traffic/constructions';
import { TrafficPageClient } from './TrafficPageClient';

export const dynamic = 'force-dynamic';

export default async function TrafficPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Daten aus DB laden
  const activeConstructions = await getActiveConstructions();
  const plannedConstructions = await getPlannedConstructions();

  return (
    <TrafficPageClient
      activeConstructions={activeConstructions}
      plannedConstructions={plannedConstructions}
    />
  );
}
