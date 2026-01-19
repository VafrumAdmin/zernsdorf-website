'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { WasteCalendar } from '@/components/waste';
import { useWasteSettings } from '@/hooks/useWasteSettings';
import { generateICS } from '@/lib/waste/ics-parser';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import {
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MapPin,
  Loader2,
} from 'lucide-react';
import type { WasteCollection, WasteType } from '@/types';

interface WasteAPIResponse {
  success: boolean;
  data: WasteCollection[];
  source: 'sbazv' | 'cache' | 'fallback';
  error?: string;
  address?: string;
  needsSetup?: boolean;
}

interface StreetOption {
  value: string;
  label: string;
}

interface SbazvLookupResponse {
  success: boolean;
  streets?: StreetOption[];
  housenumbers?: string[];
  calendarUrl?: string;
  error?: string;
}

const DEFAULT_ENABLED_TYPES: WasteType[] = ['restmuell', 'papier', 'gelbesack', 'laubsaecke'];

export default function WastePage() {
  const t = useTranslations('waste');
  const { settings, isLoading: settingsLoading, saveSettings } = useWasteSettings();

  // Kalender-Daten
  const [collections, setCollections] = useState<WasteCollection[]>([]);
  const [dataSource, setDataSource] = useState<'sbazv' | 'cache' | 'fallback' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [addressFromData, setAddressFromData] = useState<string | null>(null);

  // Setup-Formular
  const [showSetup, setShowSetup] = useState(false);
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [housenumbers, setHousenumbers] = useState<string[]>([]);
  const [selectedStreet, setSelectedStreet] = useState('');
  const [selectedHousenumber, setSelectedHousenumber] = useState('');
  const [isLoadingStreets, setIsLoadingStreets] = useState(false);
  const [isLoadingHousenumbers, setIsLoadingHousenumbers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Lade Straßen beim Öffnen des Setups
  useEffect(() => {
    if (showSetup && streets.length === 0) {
      loadStreets();
    }
  }, [showSetup]);

  // Lade Hausnummern wenn Straße ausgewählt
  useEffect(() => {
    if (selectedStreet) {
      loadHousenumbers(selectedStreet);
    } else {
      setHousenumbers([]);
      setSelectedHousenumber('');
    }
  }, [selectedStreet]);

  // Setze gespeicherte Werte wenn Settings geladen
  useEffect(() => {
    if (settings?.street) {
      setSelectedStreet(settings.street);
    }
    if (settings?.houseNumber) {
      setSelectedHousenumber(settings.houseNumber);
    }
  }, [settings?.street, settings?.houseNumber]);

  const loadStreets = async () => {
    setIsLoadingStreets(true);
    setSetupError(null);
    try {
      const response = await fetch('/api/waste/sbazv-lookup?action=streets');
      const data: SbazvLookupResponse = await response.json();

      if (data.success && data.streets) {
        setStreets(data.streets);
      } else {
        setSetupError(data.error || 'Fehler beim Laden der Straßen');
      }
    } catch (error) {
      setSetupError('Verbindung zum Server fehlgeschlagen');
    } finally {
      setIsLoadingStreets(false);
    }
  };

  const loadHousenumbers = async (street: string) => {
    setIsLoadingHousenumbers(true);
    setHousenumbers([]);
    setSelectedHousenumber('');
    try {
      const response = await fetch(`/api/waste/sbazv-lookup?action=housenumbers&street=${encodeURIComponent(street)}`);
      const data: SbazvLookupResponse = await response.json();

      if (data.success && data.housenumbers) {
        setHousenumbers(data.housenumbers);
      }
    } catch (error) {
      console.error('Error loading housenumbers:', error);
    } finally {
      setIsLoadingHousenumbers(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedStreet || !selectedHousenumber) return;

    setIsSubmitting(true);
    setSetupError(null);

    try {
      // Hole Kalender-URL vom SBAZV
      const response = await fetch(
        `/api/waste/sbazv-lookup?action=calendar-url&street=${encodeURIComponent(selectedStreet)}&housenumber=${encodeURIComponent(selectedHousenumber)}`
      );
      const data: SbazvLookupResponse = await response.json();

      if (data.success && data.calendarUrl) {
        // Bereinige Straßennamen für Anzeige
        const cleanStreetName = selectedStreet
          .replace(' (Zernsdorf)', '')
          .replace(' (Zernsdorf (Kablow-Ziegelei))', ' (Kablow-Ziegelei)');

        // Speichere Settings
        const newSettings = {
          icsUrl: data.calendarUrl,
          street: cleanStreetName,
          houseNumber: selectedHousenumber,
          enabledTypes: settings?.enabledTypes || DEFAULT_ENABLED_TYPES,
          notifications: settings?.notifications || false,
        };
        saveSettings(newSettings);
        setShowSetup(false);

        // Lade Daten mit neuer URL
        fetchCollections(data.calendarUrl);
      } else {
        setSetupError(data.error || 'Konnte Adresse nicht einrichten');
      }
    } catch (error) {
      setSetupError('Verbindung zum Server fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchCollections = useCallback(
    async (customUrl?: string) => {
      setIsRefreshing(true);
      setFetchError(null);

      try {
        const urlParam = customUrl || settings?.icsUrl;

        if (!urlParam) {
          setFetchError(null);
          setIsRefreshing(false);
          return;
        }

        const apiUrl = `/api/waste?days=90&icsUrl=${encodeURIComponent(urlParam)}`;
        const response = await fetch(apiUrl);
        const data: WasteAPIResponse = await response.json();

        if (data.success && data.data) {
          const collectionsWithDates = data.data.map((c) => ({
            ...c,
            date: new Date(c.date),
          }));
          setCollections(collectionsWithDates);
          setDataSource(data.source);
          if (data.address) {
            setAddressFromData(data.address);
          }
        } else {
          setFetchError(data.error || 'Fehler beim Laden der Daten');
        }
      } catch (error) {
        console.error('Failed to fetch waste collections:', error);
        setFetchError('Verbindung zum Server fehlgeschlagen');
      } finally {
        setIsRefreshing(false);
      }
    },
    [settings?.icsUrl]
  );

  useEffect(() => {
    if (!settingsLoading && settings?.icsUrl) {
      fetchCollections();
    }
  }, [settingsLoading, settings?.icsUrl, fetchCollections]);

  const enabledTypes = settings?.enabledTypes || DEFAULT_ENABLED_TYPES;

  const handleExport = () => {
    if (!collections.length) return;

    const filteredCollections = collections.filter((c) => enabledTypes.includes(c.type));
    const icsContent = generateICS(
      filteredCollections,
      `Müllabfuhr Zernsdorf${addressFromData ? ` - ${addressFromData}` : ''}`
    );

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'muellabfuhr-zernsdorf.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  const needsSetup = !settings?.icsUrl;

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>

        {/* Setup-Hinweis wenn keine Adresse konfiguriert */}
        {needsSetup && !showSetup && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse eingeben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wähle deine Straße und Hausnummer aus, um die Abholtermine für deine Adresse zu sehen.
              </p>
              <Button onClick={() => setShowSetup(true)} className="gap-2">
                <MapPin className="h-4 w-4" />
                Adresse auswählen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Setup-Formular */}
        {showSetup && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Deine Adresse in Zernsdorf
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Straßen-Auswahl */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Straße</label>
                {isLoadingStreets ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lade Straßen...
                  </div>
                ) : (
                  <select
                    value={selectedStreet}
                    onChange={(e) => setSelectedStreet(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Straße auswählen...</option>
                    {streets.map((street) => (
                      <option key={street.value} value={street.value}>
                        {street.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Hausnummer-Auswahl */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hausnummer</label>
                {isLoadingHousenumbers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lade Hausnummern...
                  </div>
                ) : (
                  <select
                    value={selectedHousenumber}
                    onChange={(e) => setSelectedHousenumber(e.target.value)}
                    disabled={!selectedStreet || housenumbers.length === 0}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedStreet
                        ? 'Zuerst Straße auswählen'
                        : housenumbers.length === 0
                          ? 'Keine Hausnummern verfügbar'
                          : 'Hausnummer auswählen...'}
                    </option>
                    {housenumbers.map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {setupError && (
                <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {setupError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveAddress}
                  disabled={!selectedStreet || !selectedHousenumber || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
                <Button variant="ghost" onClick={() => setShowSetup(false)}>
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Card - nur wenn Setup abgeschlossen */}
        {!needsSetup && !showSetup && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Abholtermine für</p>
                  <p className="font-medium">
                    {addressFromData || `${settings?.street} ${settings?.houseNumber}` || 'Deine Adresse'}
                  </p>
                  {dataSource && (
                    <div className="mt-2 flex items-center gap-2">
                      {dataSource === 'sbazv' && (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Live-Daten vom SBAZV
                        </Badge>
                      )}
                      {dataSource === 'cache' && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Gecachte Daten
                        </Badge>
                      )}
                      {dataSource === 'fallback' && (
                        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          Beispieldaten
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCollections()}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Aktualisieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSetup(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Adresse ändern
                  </Button>
                </div>
              </div>
              {fetchError && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {fetchError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        {collections.length > 0 ? (
          <WasteCalendar
            collections={collections}
            enabledTypes={enabledTypes}
            onExport={handleExport}
          />
        ) : needsSetup ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Wähle deine Adresse aus, um die Abholtermine zu sehen.
              </p>
            </CardContent>
          </Card>
        ) : isRefreshing ? (
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">
                Lade Abholtermine...
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
