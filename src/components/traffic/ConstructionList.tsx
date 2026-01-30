'use client';

import { useTranslations } from 'next-intl';
import { ConstructionCard } from './ConstructionCard';
import { Card, CardContent } from '@/components/ui';
import type { Construction } from '@/types';
import { CheckCircle } from 'lucide-react';

interface ConstructionListProps {
  constructions: Construction[];
  emptyMessage?: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

export function ConstructionList({ constructions, emptyMessage, selectedId, onSelect }: ConstructionListProps) {
  const t = useTranslations('traffic');

  if (constructions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-muted-foreground">{emptyMessage || t('noConstructions')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {constructions.map((construction) => (
        <ConstructionCard
          key={construction.id}
          construction={construction}
          isSelected={selectedId === construction.id}
          onSelect={onSelect ? () => onSelect(selectedId === construction.id ? null : construction.id) : undefined}
        />
      ))}
    </div>
  );
}
