'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, Badge } from '@/components/ui';
import type { HistoryEntry } from '@/types';

interface TimelineProps {
  entries: HistoryEntry[];
}

const categoryConfig: Record<
  HistoryEntry['category'],
  { color: string; bgColor: string; icon: string }
> = {
  founding: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: '🏛️' },
  development: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: '📈' },
  war: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: '⚔️' },
  modern: { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: '🏠' },
  culture: { color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: '🎭' },
};

export function Timeline({ entries }: TimelineProps) {
  const t = useTranslations('history');

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

      <div className="space-y-8">
        {entries.map((entry, index) => {
          const config = categoryConfig[entry.category];

          return (
            <div key={entry.id} className="relative">
              {/* Year marker for desktop */}
              <div className="hidden md:flex absolute left-0 w-16 h-16 items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center text-xl z-10`}
                >
                  {config.icon}
                </div>
              </div>

              {/* Card */}
              <Card className="md:ml-24">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Mobile icon */}
                    <div
                      className={`md:hidden w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center text-xl flex-shrink-0`}
                    >
                      {config.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-primary">{entry.year}</span>
                        <Badge variant="outline" className={config.color}>
                          {t(`categories.${entry.category}`)}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                      <p className="text-muted-foreground">{entry.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
