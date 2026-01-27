'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  Loader2,
  ArrowLeft,
  Camera,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isLoading: authLoading, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    nickname: '',
    bio: '',
    phone: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: 'Zernsdorf',
    work_street: '',
    work_house_number: '',
    work_postal_code: '',
    work_city: '',
    work_arrival_time: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        nickname: profile.nickname || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        street: profile.street || '',
        house_number: profile.house_number || '',
        postal_code: profile.postal_code || '',
        city: profile.city || 'Zernsdorf',
        work_street: profile.work_street || '',
        work_house_number: profile.work_house_number || '',
        work_postal_code: profile.work_postal_code || '',
        work_city: profile.work_city || '',
        work_arrival_time: profile.work_arrival_time || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profil wurde erfolgreich aktualisiert');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ein Fehler ist aufgetreten');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Profil bearbeiten</h1>
          <p className="text-slate-600 mt-1">
            Aktualisieren Sie Ihre persönlichen Informationen
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Profilbild</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  JPG, PNG oder GIF. Maximal 2MB.
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Bild hochladen
                </button>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Persönliche Informationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Benutzername *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-2">
                  Spitzname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Wird statt Vorname angezeigt"
                />
              </div>

              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Vorname
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Nachname
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                  Über mich
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ein paar Worte über Sie..."
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              Wohnadresse
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Ihre Adresse wird für lokale Dienste wie Müllabfuhr und Busverbindungen verwendet.
              Sie können wählen, ob diese lokal oder in der Datenbank gespeichert wird.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-slate-700 mb-2">
                  Straße
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="house_number" className="block text-sm font-medium text-slate-700 mb-2">
                  Hausnummer
                </label>
                <input
                  id="house_number"
                  name="house_number"
                  type="text"
                  value={formData.house_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-slate-700 mb-2">
                  Postleitzahl
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="15712"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                  Ort
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Work Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" />
              Arbeitsplatz (optional)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Für Pendelrouten und Verkehrsinformationen auf Ihrem Arbeitsweg.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="work_street" className="block text-sm font-medium text-slate-700 mb-2">
                  Straße
                </label>
                <input
                  id="work_street"
                  name="work_street"
                  type="text"
                  value={formData.work_street}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="work_house_number" className="block text-sm font-medium text-slate-700 mb-2">
                  Hausnummer
                </label>
                <input
                  id="work_house_number"
                  name="work_house_number"
                  type="text"
                  value={formData.work_house_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="work_postal_code" className="block text-sm font-medium text-slate-700 mb-2">
                  Postleitzahl
                </label>
                <input
                  id="work_postal_code"
                  name="work_postal_code"
                  type="text"
                  value={formData.work_postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="work_city" className="block text-sm font-medium text-slate-700 mb-2">
                  Ort
                </label>
                <input
                  id="work_city"
                  name="work_city"
                  type="text"
                  value={formData.work_city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="work_arrival_time" className="block text-sm font-medium text-slate-700 mb-2">
                  Gewünschte Ankunftszeit
                </label>
                <input
                  id="work_arrival_time"
                  name="work_arrival_time"
                  type="time"
                  value={formData.work_arrival_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
