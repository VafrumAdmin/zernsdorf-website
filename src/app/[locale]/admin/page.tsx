'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  AlertTriangle,
} from 'lucide-react';

interface ConfigResponse {
  success: boolean;
  config: {
    hasIcsUrl: boolean;
    icsUrlConfigured: string;
  };
  cacheStatus: {
    hasCache: boolean;
    lastFetched: string | null;
    collectionCount: number;
    cacheAgeMinutes: number | null;
  };
  anleitung: {
    title: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
    }>;
    hinweise: string[];
  };
  links: {
    sbazv: string;
    entsorgungstermine: string;
    abfuhrportal: string;
  };
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  eventCount?: number;
  hint?: string;
}

export default function AdminPage() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/waste/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const testIcsUrl = async () => {
    if (!testUrl) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/waste/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Test fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannt'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/waste/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true }),
      });
      const data = await res.json();
      setSyncResult({
        success: data.success,
        message: data.success
          ? `Sync erfolgreich! ${data.collectionsLoaded} Termine geladen.`
          : data.error || 'Sync fehlgeschlagen',
      });
      fetchConfig(); // Refresh config
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Sync fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannt'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyEnvLine = () => {
    const envLine = `SBAZV_ICS_URL=${testUrl}`;
    navigator.clipboard.writeText(envLine);
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Lädt Konfiguration...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">SBAZV Müllabfuhr Admin</h1>
          <p className="mt-2 text-muted-foreground">
            Konfiguration für den automatischen Abruf der Mülltermine vom SBAZV
          </p>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {config.config.hasIcsUrl ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ICS-URL konfiguriert</p>
                <p className="font-medium">{config.config.icsUrlConfigured}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cache Status</p>
                <p className="font-medium">
                  {config.cacheStatus.hasCache
                    ? `${config.cacheStatus.collectionCount} Termine (${config.cacheStatus.cacheAgeMinutes} Min. alt)`
                    : 'Kein Cache'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={triggerSync} disabled={isSyncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Jetzt synchronisieren
              </Button>
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-md ${syncResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
              >
                {syncResult.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL Tester */}
        <Card>
          <CardHeader>
            <CardTitle>ICS-URL testen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Füge hier die URL ein, die du vom SBAZV-Kalenderexport kopiert hast, um sie zu testen.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button onClick={testIcsUrl} disabled={isTesting || !testUrl}>
                {isTesting ? 'Teste...' : 'Testen'}
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-md ${testResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {testResult.success ? testResult.message : testResult.error}
                    </p>
                    {testResult.hint && (
                      <p className="text-sm text-muted-foreground mt-1">{testResult.hint}</p>
                    )}
                    {testResult.success && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyEnvLine}
                        className="mt-2 gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        SBAZV_ICS_URL=... kopieren
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anleitung */}
        <Card>
          <CardHeader>
            <CardTitle>{config.anleitung.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {config.anleitung.steps.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Hinweise
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {config.anleitung.hinweise.map((hinweis, i) => (
                  <li key={i}>{hinweis}</li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4 flex gap-2">
              <a
                href={config.links.abfuhrportal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                SBAZV Abfuhrportal öffnen
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
