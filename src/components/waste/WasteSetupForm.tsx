'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Select, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { getStreetOptions } from '@/lib/waste/streets';
import type { WasteSettings, WasteType } from '@/types';
import { MapPin, Bell, Shield, Cloud } from 'lucide-react';

interface WasteSetupFormProps {
  onSubmit: (settings: WasteSettings) => void;
  initialSettings?: WasteSettings;
}

const WASTE_TYPES: { value: WasteType; labelKey: string; color: string }[] = [
  { value: 'restmuell', labelKey: 'restmuell', color: 'bg-gray-500' },
  { value: 'papier', labelKey: 'papier', color: 'bg-blue-500' },
  { value: 'gelbesack', labelKey: 'gelbesack', color: 'bg-yellow-500' },
  { value: 'bio', labelKey: 'bio', color: 'bg-green-500' },
  { value: 'laubsaecke', labelKey: 'laubsaecke', color: 'bg-amber-700' },
];

export function WasteSetupForm({ onSubmit, initialSettings }: WasteSetupFormProps) {
  const t = useTranslations('waste');

  const [street, setStreet] = useState(initialSettings?.street || '');
  const [houseNumber, setHouseNumber] = useState(initialSettings?.houseNumber || '');
  const [enabledTypes, setEnabledTypes] = useState<WasteType[]>(
    initialSettings?.enabledTypes || ['restmuell', 'papier', 'gelbesack']
  );
  const [notifications, setNotifications] = useState(initialSettings?.notifications ?? false);

  const streetOptions = getStreetOptions();

  const toggleWasteType = (type: WasteType) => {
    setEnabledTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street) return;

    onSubmit({
      street,
      houseNumber,
      enabledTypes,
      notifications,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('setupRequired')}</CardTitle>
          </div>
          <CardDescription>{t('setupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label={t('street')}
            options={streetOptions}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t('selectStreet')}
            required
          />
          <Input
            label={t('houseNumber')}
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="z.B. 12a"
          />
        </CardContent>
      </Card>

      {/* Waste Types Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abfallarten</CardTitle>
          <CardDescription>Wählen Sie die Abfallarten, die Sie angezeigt bekommen möchten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WASTE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleWasteType(type.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  enabledTypes.includes(type.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-4 h-4 rounded ${type.color}`} />
                <span className="text-sm font-medium">{t(`types.${type.labelKey}`)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('notifications')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">{t('enableNotifications')}</span>
          </label>
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">Datenschutz</p>
              <p className="text-muted-foreground">{t('privacyNote')}</p>
              <div className="flex items-center gap-2 pt-2">
                <Cloud className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('privacyNoteAccount')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={!street} className="flex-1">
          {t('useLocalStorage')}
        </Button>
      </div>
    </form>
  );
}
