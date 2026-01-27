'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Building2,
  Calendar,
  Car,
  LayoutDashboard,
  Plus,
  Edit,
  Power,
  Search,
  ChevronDown,
  X,
  Save,
  MapPin,
  Phone,
  Globe,
  Star,
  Users,
  TrendingUp,
  Menu,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type {
  BusinessWithCategory,
  BusinessCategory,
  Event,
  EventCategory,
  TrafficLocation,
  TrafficStatusWithLocation,
  AdminDashboardStats,
} from '@/types/database';

// ============================================
// INTERFACES
// ============================================

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

type TabType = 'dashboard' | 'directory' | 'traffic' | 'events' | 'maintenance' | 'waste';

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

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

  // Directory State
  const [businesses, setBusinesses] = useState<BusinessWithCategory[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);
  const [businessSearch, setBusinessSearch] = useState('');
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState('');

  // Events State
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Traffic State
  const [trafficLocations, setTrafficLocations] = useState<TrafficLocation[]>([]);
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatusWithLocation[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

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

  const fetchBusinesses = useCallback(async () => {
    setBusinessesLoading(true);
    try {
      const params = new URLSearchParams({ showInactive: 'true' });
      if (businessSearch) params.set('search', businessSearch);
      if (businessCategoryFilter) params.set('category', businessCategoryFilter);

      const res = await fetch(`/api/admin/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setBusinessesLoading(false);
    }
  }, [businessSearch, businessCategoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/admin/events?showInactive=true');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchTraffic = useCallback(async () => {
    setTrafficLoading(true);
    try {
      const res = await fetch('/api/admin/traffic');
      const data = await res.json();
      setTrafficLocations(data.locations || []);
      setTrafficStatus(data.status || []);
    } catch (error) {
      console.error('Error fetching traffic:', error);
    } finally {
      setTrafficLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    checkSession();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchMaintenanceStatus();
      fetchWasteConfig();
      fetchCategories();
    }
  }, [isAuthenticated, fetchStats]);

  // Load tab-specific data
  useEffect(() => {
    if (!isAuthenticated) return;

    switch (activeTab) {
      case 'directory':
        fetchBusinesses();
        break;
      case 'events':
        fetchEvents();
        break;
      case 'traffic':
        fetchTraffic();
        break;
    }
  }, [activeTab, isAuthenticated, fetchBusinesses, fetchEvents, fetchTraffic]);

  // ============================================
  // HANDLERS
  // ============================================

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

  // Business Handlers
  const toggleBusinessActive = async (business: BusinessWithCategory) => {
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, is_active: !business.is_active }),
      });
      if (res.ok) {
        fetchBusinesses();
      }
    } catch (error) {
      console.error('Error toggling business:', error);
    }
  };

  const deleteBusiness = async (id: string) => {
    if (!confirm('Diesen Eintrag wirklich löschen?')) return;

    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        fetchBusinesses();
      } else {
        alert(`Fehler beim Löschen: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Fehler beim Löschen des Eintrags');
    }
  };

  // Event Handlers
  const toggleEventActive = async (event: Event) => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, is_active: !event.is_active }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error toggling event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Dieses Event wirklich löschen?')) return;

    try {
      const res = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        fetchEvents();
      } else {
        alert(`Fehler beim Löschen: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Fehler beim Löschen des Events');
    }
  };

  // Traffic Handlers
  const updateTrafficStatus = async (locationId: string, status: string, statusLevel: string, message: string) => {
    try {
      const res = await fetch('/api/admin/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          status,
          status_level: statusLevel,
          message: message || null,
        }),
      });
      if (res.ok) {
        fetchTraffic();
      }
    } catch (error) {
      console.error('Error updating traffic:', error);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'directory', label: 'Branchenverzeichnis', icon: <Building2 className="w-4 h-4" /> },
    { id: 'traffic', label: 'Verkehrsstatus', icon: <Car className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Wartungsmodus', icon: <Wrench className="w-4 h-4" /> },
    { id: 'waste', label: 'Müllabfuhr', icon: <Trash2 className="w-4 h-4" /> },
  ];

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

            <form onSubmit={handleLogin} className="p-8">
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
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

  // ============================================
  // ADMIN DASHBOARD
  // ============================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Settings className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin-Portal</h1>
                <p className="text-xs text-slate-500">ZernsdorfConnect</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Website</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status-Banner */}
        {maintenance.enabled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Wartungsmodus ist aktiv</p>
              <p className="text-sm text-amber-700 mt-1">
                Besucher sehen aktuell die Wartungsseite.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.businesses_active || 0}</p>
                    <p className="text-sm text-slate-500">Einträge aktiv</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.events_upcoming || 0}</p>
                    <p className="text-sm text-slate-500">Events geplant</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Car className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.traffic_alerts || 0}</p>
                    <p className="text-sm text-slate-500">Verkehrsmeldungen</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.users_count || 0}</p>
                    <p className="text-sm text-slate-500">Benutzer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Schnellaktionen
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => { setActiveTab('directory'); setShowBusinessForm(true); }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="font-medium text-slate-900 text-sm">Neuer Eintrag</p>
                  <p className="text-xs text-slate-500">Branchenverzeichnis</p>
                </button>
                <button
                  onClick={() => { setActiveTab('events'); setShowEventForm(true); }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                >
                  <Calendar className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="font-medium text-slate-900 text-sm">Neues Event</p>
                  <p className="text-xs text-slate-500">Veranstaltung anlegen</p>
                </button>
                <button
                  onClick={() => setActiveTab('traffic')}
                  className="p-4 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
                >
                  <Car className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="font-medium text-slate-900 text-sm">Verkehrsstatus</p>
                  <p className="text-xs text-slate-500">Ampeln aktualisieren</p>
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className="p-4 border border-slate-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                >
                  <Wrench className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="font-medium text-slate-900 text-sm">Wartungsmodus</p>
                  <p className="text-xs text-slate-500">{maintenance.enabled ? 'Aktiv' : 'Inaktiv'}</p>
                </button>
              </div>
            </div>

            {/* Verwaltungs-Links */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                Verwaltung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/de/admin/users" className="group p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Nutzerverwaltung</p>
                      <p className="text-xs text-slate-500">Nutzer, Rollen, Berechtigungen</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </Link>
                <Link href="/de/admin/menu" className="group p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition">
                      <Menu className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Menüverwaltung</p>
                      <p className="text-xs text-slate-500">Menüpunkte ein-/ausblenden</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </Link>
                <Link href="/de/admin/roles" className="group p-4 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Rollenverwaltung</p>
                      <p className="text-xs text-slate-500">Rollen und Berechtigungen</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <select
                  value={businessCategoryFilter}
                  onChange={(e) => setBusinessCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Alle Kategorien</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => { setEditingBusiness(null); setShowBusinessForm(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuer Eintrag
              </Button>
            </div>

            {/* Business List */}
            {businessesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Noch keine Einträge vorhanden.</p>
                <Button
                  onClick={() => setShowBusinessForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ersten Eintrag hinzufügen
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Kategorie</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Ort</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {businesses.map((business) => (
                        <tr key={business.id} className={`hover:bg-slate-50 ${!business.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-slate-900">{business.name}</p>
                                {business.description && (
                                  <p className="text-sm text-slate-500 truncate max-w-xs">{business.description}</p>
                                )}
                              </div>
                              {business.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${business.category_color}20`, color: business.category_color || '#666' }}
                            >
                              {business.category_display_name || 'Keine'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{business.location}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              business.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {business.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleBusinessActive(business)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  business.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={business.is_active ? 'Deaktivieren' : 'Aktivieren'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingBusiness(business); setShowBusinessForm(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Bearbeiten"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteBusiness(business.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Business Form Modal */}
            {showBusinessForm && (
              <BusinessFormModal
                business={editingBusiness}
                categories={categories}
                onClose={() => { setShowBusinessForm(false); setEditingBusiness(null); }}
                onSave={() => { setShowBusinessForm(false); setEditingBusiness(null); fetchBusinesses(); }}
              />
            )}
          </div>
        )}

        {/* Traffic Tab */}
        {activeTab === 'traffic' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" />
                Verkehrs-Ampeln
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Setze den Status für die wichtigsten Verkehrspunkte in Zernsdorf.
              </p>

              {trafficLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {trafficLocations.map((location) => {
                    const currentStatus = trafficStatus.find(s => s.location_id === location.id);
                    return (
                      <TrafficLocationCard
                        key={location.id}
                        location={location}
                        status={currentStatus}
                        onUpdate={updateTrafficStatus}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Veranstaltungen verwalten</h3>
              <Button
                onClick={() => { setEditingEvent(null); setShowEventForm(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Neues Event
              </Button>
            </div>

            {eventsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Noch keine Events vorhanden.</p>
                <Button
                  onClick={() => setShowEventForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Erstes Event anlegen
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`bg-white rounded-xl border border-slate-200 p-4 ${!event.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="text-center bg-slate-100 rounded-lg px-3 py-2 min-w-[60px]">
                          <p className="text-xs text-slate-500 uppercase">
                            {new Date(event.start_date).toLocaleDateString('de-DE', { month: 'short' })}
                          </p>
                          <p className="text-xl font-bold text-slate-900">
                            {new Date(event.start_date).getDate()}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{event.title}</h4>
                          <p className="text-sm text-slate-500">{event.location_name}</p>
                          {event.start_time && (
                            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {event.start_time.slice(0, 5)} Uhr
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {event.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <button
                          onClick={() => toggleEventActive(event)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingEvent(event); setShowEventForm(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Event Form Modal */}
            {showEventForm && (
              <EventFormModal
                event={editingEvent}
                onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
                onSave={() => { setShowEventForm(false); setEditingEvent(null); fetchEvents(); }}
              />
            )}
          </div>
        )}

        {/* Wartungsmodus Tab */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Wartungsmodus</h2>
                  <p className="text-sm text-slate-500">Website vorübergehend offline schalten</p>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    maintenance.enabled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {maintenance.enabled ? (
                      <><AlertTriangle className="w-4 h-4" /> Wartungsmodus aktiv</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Website online</>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nachricht für Besucher</label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  />
                </div>

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

                <div className="flex gap-3">
                  {maintenance.enabled ? (
                    <Button onClick={disableMaintenance} disabled={isLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isLoading ? 'Wird deaktiviert...' : 'Website aktivieren'}
                    </Button>
                  ) : (
                    <Button onClick={enableMaintenance} disabled={isLoading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                      {isLoading ? 'Wird aktiviert...' : 'Wartungsmodus aktivieren'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Schnellzugriff</h2>
              </div>
              <div className="p-6 space-y-3">
                <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                  <Home className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">Website öffnen</p>
                    <p className="text-sm text-slate-500">In neuem Tab</p>
                  </div>
                </a>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">Datenschutz</p>
                    <p className="text-sm text-slate-500">Prüfen</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Müllabfuhr Tab */}
        {activeTab === 'waste' && config && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.config.hasIcsUrl ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {config.config.hasIcsUrl ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">SBAZV Status</h2>
                  <p className="text-sm text-slate-500">Müllabfuhr-Synchronisation</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500">ICS-URL</p>
                    <p className="font-medium text-slate-900">{config.config.icsUrlConfigured}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cache</p>
                    <p className="font-medium text-slate-900">
                      {config.cacheStatus.hasCache ? `${config.cacheStatus.collectionCount} Termine` : 'Kein Cache'}
                    </p>
                  </div>
                </div>

                <Button onClick={triggerSync} disabled={isSyncing} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Jetzt synchronisieren
                </Button>

                {syncResult && (
                  <div className={`mt-4 p-3 rounded-lg ${syncResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {syncResult.message}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">ICS-URL testen</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://fahrzeuge.sbazv.de/..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button onClick={testIcsUrl} disabled={isTesting || !testUrl} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isTesting ? 'Teste...' : 'Testen'}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className="flex items-start gap-2">
                      {testResult.success ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      <div>
                        <p className={`font-medium ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                          {testResult.success ? testResult.message : testResult.error}
                        </p>
                        {testResult.success && (
                          <Button variant="outline" size="sm" onClick={copyEnvLine} className="mt-2 gap-2">
                            <Copy className="h-4 w-4" />
                            URL kopieren
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

// Traffic Location Card
function TrafficLocationCard({
  location,
  status,
  onUpdate,
}: {
  location: TrafficLocation;
  status?: TrafficStatusWithLocation;
  onUpdate: (locationId: string, status: string, level: string, message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(status?.status || 'open');
  const [newLevel, setNewLevel] = useState(status?.status_level || 'green');
  const [newMessage, setNewMessage] = useState(status?.message || '');

  const statusOptions = [
    { value: 'open', level: 'green', label: 'Offen', color: 'bg-green-500' },
    { value: 'restricted', level: 'yellow', label: 'Eingeschränkt', color: 'bg-yellow-500' },
    { value: 'closed', level: 'red', label: 'Gesperrt', color: 'bg-red-500' },
    { value: 'construction', level: 'yellow', label: 'Baustelle', color: 'bg-orange-500' },
  ];

  const currentOption = statusOptions.find(o => o.value === (status?.status || 'open')) || statusOptions[0];

  const handleSave = () => {
    onUpdate(location.id, newStatus, newLevel, newMessage);
    setIsEditing(false);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${currentOption.color}`}></div>
          <div>
            <p className="font-medium text-slate-900">{location.name}</p>
            {status?.message && (
              <p className="text-sm text-slate-500">{status.message}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentOption.value === 'open' ? 'bg-green-100 text-green-700' :
            currentOption.value === 'closed' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {currentOption.label}
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => {
                const value = e.target.value as 'open' | 'closed' | 'restricted' | 'construction' | 'unknown';
                setNewStatus(value);
                const opt = statusOptions.find(o => o.value === value);
                if (opt) setNewLevel(opt.level as 'green' | 'yellow' | 'red' | 'gray');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hinweis (optional)</label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="z.B. Gesperrt bis 15.03."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="w-4 h-4" />
              Speichern
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Business Form Modal
function BusinessFormModal({
  business,
  categories,
  onClose,
  onSave,
}: {
  business: BusinessWithCategory | null;
  categories: BusinessCategory[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    category_id: business?.category_id || '',
    description: business?.description || '',
    street: business?.street || '',
    house_number: business?.house_number || '',
    postal_code: business?.postal_code || '15712',
    city: business?.city || 'Zernsdorf',
    location: business?.location || 'Zernsdorf',
    phone: business?.phone || '',
    email: business?.email || '',
    website: business?.website || '',
    opening_hours_text: business?.opening_hours_text || '',
    is_active: business?.is_active ?? true,
    is_featured: business?.is_featured ?? false,
    is_recommended: business?.is_recommended ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const url = '/api/admin/businesses';
      const method = business ? 'PUT' : 'POST';
      const body = business ? { ...formData, id: business.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-lg text-slate-900">
            {business ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Keine Kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ort/Region</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Zernsdorf">Zernsdorf</option>
                <option value="Königs Wusterhausen">Königs Wusterhausen</option>
                <option value="Senzig">Senzig</option>
                <option value="Kablow">Kablow</option>
                <option value="Wildau">Wildau</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Straße</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hausnummer</label>
              <input
                type="text"
                value={formData.house_number}
                onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PLZ</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stadt</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Öffnungszeiten</label>
              <input
                type="text"
                value={formData.opening_hours_text}
                onChange={(e) => setFormData({ ...formData, opening_hours_text: e.target.value })}
                placeholder="z.B. Mo-Fr 8-18 Uhr"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Aktiv</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Hervorgehoben</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_recommended}
                  onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Empfohlen</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
            <Button type="submit" disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Speichert...' : 'Speichern'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Event Form Modal
function EventFormModal({
  event,
  onClose,
  onSave,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date || '',
    start_time: event?.start_time || '',
    end_date: event?.end_date || '',
    end_time: event?.end_time || '',
    location_name: event?.location_name || '',
    location_address: event?.location_address || '',
    category: event?.category || 'general',
    organizer_name: event?.organizer_name || '',
    contact_email: event?.contact_email || '',
    website: event?.website || '',
    is_active: event?.is_active ?? true,
    is_featured: event?.is_featured ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const categoryOptions = [
    { value: 'general', label: 'Allgemein' },
    { value: 'festival', label: 'Fest/Festival' },
    { value: 'market', label: 'Markt' },
    { value: 'sports', label: 'Sport' },
    { value: 'culture', label: 'Kultur' },
    { value: 'community', label: 'Gemeinde' },
    { value: 'official', label: 'Offiziell' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const url = '/api/admin/events';
      const method = event ? 'PUT' : 'POST';
      const body = event ? { ...formData, id: event.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-lg text-slate-900">
            {event ? 'Event bearbeiten' : 'Neues Event'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Startzeit</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endzeit</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Veranstaltungsort</label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="z.B. Bürgerhaus"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Veranstalter</label>
              <input
                type="text"
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kontakt E-Mail</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Aktiv</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Hervorgehoben</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
            <Button type="submit" disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Speichert...' : 'Speichern'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
