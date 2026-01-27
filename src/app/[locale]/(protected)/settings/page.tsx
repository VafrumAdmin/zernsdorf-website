'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Settings,
  Lock,
  Bell,
  Eye,
  Database,
  Trash2,
  ArrowLeft,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { profile, isLoading: authLoading, updateProfile, updatePassword, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('account');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preferences state
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: false,
    store_data_locally: false,
    preferred_language: 'de',
    theme: 'system',
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');

  // Load preferences
  useEffect(() => {
    if (profile) {
      setPreferences({
        email_notifications: profile.email_notifications ?? true,
        push_notifications: profile.push_notifications ?? false,
        store_data_locally: profile.store_data_locally ?? false,
        preferred_language: profile.preferred_language || 'de',
        theme: profile.theme || 'system',
      });
    }
  }, [profile]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (passwordData.new.length < 8) {
      setPasswordError('Das Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setPasswordLoading(true);

    try {
      await updatePassword(passwordData.new);
      setPasswordSuccess('Passwort wurde erfolgreich geändert');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Ein Fehler ist aufgetreten');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePrefsChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    setPrefsLoading(true);
    try {
      await updateProfile(preferences);
      setPrefsSuccess('Einstellungen gespeichert');
      setTimeout(() => setPrefsSuccess(''), 3000);
    } catch {
      // Error handling
    } finally {
      setPrefsLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Konto', icon: Settings },
    { id: 'password', label: 'Passwort', icon: Lock },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'privacy', label: 'Privatsphäre', icon: Eye },
    { id: 'data', label: 'Daten', icon: Database },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Einstellungen</h1>
          <p className="text-slate-600 mt-1">
            Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Kontoinformationen</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      E-Mail-Adresse
                    </label>
                    <p className="text-slate-600">{profile?.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Die E-Mail-Adresse kann nicht geändert werden.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mitglied seit
                    </label>
                    <p className="text-slate-600">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <Link
                      href="/profile"
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Profil bearbeiten →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Passwort ändern</h2>

                {passwordSuccess && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label htmlFor="current" className="block text-sm font-medium text-slate-700 mb-2">
                      Aktuelles Passwort
                    </label>
                    <input
                      id="current"
                      type="password"
                      value={passwordData.current}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, current: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="new" className="block text-sm font-medium text-slate-700 mb-2">
                      Neues Passwort
                    </label>
                    <input
                      id="new"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, new: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-2">
                      Passwort bestätigen
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    Passwort ändern
                  </button>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Benachrichtigungen</h2>

                {prefsSuccess && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {prefsSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">E-Mail-Benachrichtigungen</p>
                      <p className="text-sm text-slate-500">
                        Erhalten Sie E-Mails bei neuen Antworten und Nachrichten
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => handlePrefsChange('email_notifications', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">Push-Benachrichtigungen</p>
                      <p className="text-sm text-slate-500">
                        Erhalten Sie Echtzeit-Benachrichtigungen im Browser
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.push_notifications}
                      onChange={(e) => handlePrefsChange('push_notifications', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <button
                    onClick={savePreferences}
                    disabled={prefsLoading}
                    className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {prefsLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Privatsphäre</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Ihre Privatsphäre ist uns wichtig. Hier können Sie festlegen, welche
                      Informationen öffentlich sichtbar sind.
                    </p>
                  </div>

                  <p className="text-slate-600">
                    Weitere Privatsphäre-Einstellungen werden bald verfügbar sein.
                  </p>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Datenspeicherung</h2>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">Daten lokal speichern</p>
                      <p className="text-sm text-slate-500">
                        Adresse und Einstellungen nur im Browser speichern (nicht in der Datenbank)
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.store_data_locally}
                      onChange={(e) => handlePrefsChange('store_data_locally', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </label>

                  <button
                    onClick={savePreferences}
                    disabled={prefsLoading}
                    className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {prefsLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-red-200 p-6">
                  <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Gefahrenzone
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-slate-900">Konto löschen</h3>
                      <p className="text-sm text-slate-500 mb-3">
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten
                        werden unwiderruflich gelöscht.
                      </p>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Konto löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
