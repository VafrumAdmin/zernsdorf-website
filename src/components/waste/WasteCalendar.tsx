'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { Card, CardContent, Badge } from '@/components/ui';
import type { WasteCollection, WasteType } from '@/types';
import { Trash2, FileText, Package, Leaf, TreeDeciduous, Calendar, Download } from 'lucide-react';

interface WasteCalendarProps {
  collections: WasteCollection[];
  enabledTypes: WasteType[];
  onExport?: () => void;
}

const wasteTypeConfig: Record<
  WasteType,
  { icon: typeof Trash2; colorClass: string; bgClass: string }
> = {
  restmuell: { icon: Trash2, colorClass: 'text-gray-600', bgClass: 'bg-gray-500' },
  papier: { icon: FileText, colorClass: 'text-blue-600', bgClass: 'bg-blue-500' },
  gelbesack: { icon: Package, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-500' },
  bio: { icon: Leaf, colorClass: 'text-green-600', bgClass: 'bg-green-500' },
  laubsaecke: { icon: TreeDeciduous, colorClass: 'text-amber-700', bgClass: 'bg-amber-700' },
};

export function WasteCalendar({ collections, enabledTypes, onExport }: WasteCalendarProps) {
  const t = useTranslations('waste');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const filteredCollections = useMemo(() => {
    const now = startOfDay(new Date());
    return collections
      .filter((c) => enabledTypes.includes(c.type) && startOfDay(new Date(c.date)) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [collections, enabledTypes]);

  const getDateLabel = (date: Date) => {
    const d = startOfDay(new Date(date));
    const today = startOfDay(new Date());
    if (isToday(d)) return t('today');
    if (isTomorrow(d)) return t('tomorrow');
    const days = differenceInDays(d, today);
    // Korrekte Grammatik: "in 1 Tag" vs "in X Tagen"
    if (days === 1) {
      return `in 1 Tag`;
    }
    return `in ${days} Tagen`;
  };

  const nextCollection = filteredCollections[0];

  return (
    <div className="space-y-6">
      {/* Next Collection Highlight */}
      {nextCollection && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t('nextCollection')}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-12 w-12 rounded-lg ${wasteTypeConfig[nextCollection.type].bgClass} flex items-center justify-center`}
                  >
                    {(() => {
                      const Icon = wasteTypeConfig[nextCollection.type].icon;
                      return <Icon className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{t(`types.${nextCollection.type}`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(nextCollection.date), 'EEEE, d. MMMM', { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={isToday(new Date(nextCollection.date)) ? 'destructive' : 'default'}>
                  {getDateLabel(nextCollection.date)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Collections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kommende Termine
          </h3>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Download className="h-4 w-4" />
              {t('calendarExport')}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredCollections.slice(0, 10).map((collection) => {
            const config = wasteTypeConfig[collection.type];
            const Icon = config.icon;
            const date = new Date(collection.date);

            return (
              <Card key={collection.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg ${config.bgClass} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{t(`types.${collection.type}`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(date, 'EEEE, d. MMMM yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isToday(date) ? 'destructive' : isTomorrow(date) ? 'warning' : 'outline'
                    }
                  >
                    {getDateLabel(date)}
                  </Badge>
                </div>
              </Card>
            );
          })}

          {filteredCollections.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Keine anstehenden Termine</p>
            </Card>
          )}
        </div>
      </div>

      {/* Source */}
      <p className="text-xs text-muted-foreground text-center">{t('source')}</p>
    </div>
  );
}
