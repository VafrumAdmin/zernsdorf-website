'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  LogOut,
  Wrench,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Home,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  estimatedEnd: string | null;
}

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'waste'>('maintenance');

  // Wartungsmodus-State
  const [maintenance, setMaintenance] = useState<MaintenanceStatus>({
    enabled: false,
    message: '',
    estimatedEnd: null,
  });
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Die Website wird gerade gewartet. Bitte versuchen Sie es später erneut.'
  );
  const [estimatedEnd, setEstimatedEnd] = useState('');

  // Müllabfuhr-State
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Session prüfen
  useEffect(() => {
    checkSession();
    fetchMaintenanceStatus();
    fetchWasteConfig();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/admin/maintenance');
      const data = await res.json();
      setMaintenance(data);
      if (data.message) {
        setMaintenanceMessage(data.message);
      }
      if (data.estimatedEnd) {
        setEstimatedEnd(data.estimatedEnd.slice(0, 16));
      }
    } catch {
      console.error('Fehler beim Laden des Wartungsstatus');
    }
  };

  const fetchWasteConfig = async () => {
    try {
      const res = await fetch('/api/waste/config');
      const data = await res.json();
      setConfig(data);
    } catch {
      console.error('Failed to fetch config');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch {
      setLoginError('Verbindungsfehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const enableMaintenance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: maintenanceMessage,
          estimatedEnd: estimatedEnd || null,
        }),
      });

      if (res.ok) {
        await fetchMaintenanceStatus();
      }
    } catch {
      console.error('Fehler beim Aktivieren des Wartungsmodus');
    } finally {
      setIsLoading(false);
    }
  };

  const disableMaintenance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchMaintenanceStatus();
      }
    } catch {
      console.error('Fehler beim Deaktivieren des Wartungsmodus');
    } finally {
      setIsLoading(false);
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
      fetchWasteConfig();
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

  // Loading-Zustand
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  // Login-Formular
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin-Portal</h1>
                  <p className="text-emerald-100 text-sm">ZernsdorfConnect</p>
                </div>
              </div>
            </div>

            {/* Login-Formular */}
            <form onSubmit={handleLogin} className="p-8">
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Admin-Passwort
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                    placeholder="Passwort eingeben"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
              >
                {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
              </Button>

              <p className="mt-4 text-center text-sm text-slate-500">
                <a href="/" className="text-emerald-600 hover:underline">
                  Zurück zur Website
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin-Dashboard
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Settings className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Admin-Portal
                </h1>
                <p className="text-xs text-slate-500">ZernsdorfConnect</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Zur Website
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status-Banner */}
        {maintenance.enabled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                Wartungsmodus ist aktiv
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Besucher sehen aktuell die Wartungsseite anstelle der normalen Website.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-2" />
              Wartungsmodus
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'waste'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Müllabfuhr
            </button>
          </nav>
        </div>

        {/* Wartungsmodus Tab */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wartungsmodus-Karte */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Wartungsmodus</h2>
                  <p className="text-sm text-slate-500">
                    Website vorübergehend offline schalten
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* Status-Anzeige */}
                <div className="mb-6">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      maintenance.enabled
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {maintenance.enabled ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Wartungsmodus aktiv
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Website online
                      </>
                    )}
                  </div>
                </div>

                {/* Nachricht */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nachricht für Besucher
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                    placeholder="Nachricht eingeben..."
                  />
                </div>

                {/* Geschätzte Endzeit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Geschätzte Endzeit (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={estimatedEnd}
                    onChange={(e) => setEstimatedEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  {maintenance.enabled ? (
                    <Button
                      onClick={disableMaintenance}
                      disabled={isLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isLoading ? 'Wird deaktiviert...' : 'Website aktivieren'}
                    </Button>
                  ) : (
                    <Button
                      onClick={enableMaintenance}
                      disabled={isLoading}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isLoading ? 'Wird aktiviert...' : 'Wartungsmodus aktivieren'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Schnellzugriff-Karte */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Schnellzugriff</h2>
                  <p className="text-sm text-slate-500">Häufig verwendete Aktionen</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">Website öffnen</p>
                      <p className="text-sm text-slate-500">In neuem Tab anzeigen</p>
                    </div>
                  </a>

                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Shield className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">Datenschutz</p>
                      <p className="text-sm text-slate-500">Datenschutzerklärung prüfen</p>
                    </div>
                  </a>

                  <a
                    href="/imprint"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">Impressum</p>
                      <p className="text-sm text-slate-500">Impressum prüfen</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Info-Karte */}
            <div className="lg:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-sm overflow-hidden text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Hinweis zum Admin-Portal</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Das Admin-Passwort kann über die Umgebungsvariable{' '}
                  <code className="bg-slate-700 px-1.5 py-0.5 rounded">ADMIN_PASSWORD</code>{' '}
                  gesetzt werden. Ändern Sie das Standard-Passwort vor dem Produktiveinsatz.
                </p>
                <p className="text-slate-400 text-xs">
                  Standard-Passwort: <code className="bg-slate-700 px-1.5 py-0.5 rounded">zernsdorf-admin-2024</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Müllabfuhr Tab */}
        {activeTab === 'waste' && config && (
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.config.hasIcsUrl ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {config.config.hasIcsUrl ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">SBAZV Status</h2>
                  <p className="text-sm text-slate-500">Müllabfuhr-Daten Synchronisation</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500">ICS-URL konfiguriert</p>
                    <p className="font-medium text-slate-900">{config.config.icsUrlConfigured}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cache Status</p>
                    <p className="font-medium text-slate-900">
                      {config.cacheStatus.hasCache
                        ? `${config.cacheStatus.collectionCount} Termine (${config.cacheStatus.cacheAgeMinutes} Min. alt)`
                        : 'Kein Cache'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={triggerSync} disabled={isSyncing} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Jetzt synchronisieren
                  </Button>
                </div>

                {syncResult && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      syncResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {syncResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* URL Tester */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">ICS-URL testen</h2>
                <p className="text-sm text-slate-500">
                  URL vom SBAZV-Kalenderexport testen
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Button
                    onClick={testIcsUrl}
                    disabled={isTesting || !testUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isTesting ? 'Teste...' : 'Testen'}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-lg ${testResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                          {testResult.success ? testResult.message : testResult.error}
                        </p>
                        {testResult.hint && (
                          <p className="text-sm text-slate-600 mt-1">{testResult.hint}</p>
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
              </div>
            </div>

            {/* Anleitung */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">{config.anleitung.title}</h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {config.anleitung.steps.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{step.title}</p>
                        <p className="text-sm text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <p className="font-medium flex items-center gap-2 mb-2 text-slate-900">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Hinweise
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-500">
                    {config.anleitung.hinweise.map((hinweis, i) => (
                      <li key={i}>{hinweis}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <a
                    href={config.links.abfuhrportal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    SBAZV Abfuhrportal öffnen
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
