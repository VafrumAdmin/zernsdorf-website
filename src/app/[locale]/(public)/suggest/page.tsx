'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OpeningHoursEditor } from '@/components/OpeningHoursEditor';
import type { BusinessCategory, ExtendedOpeningHours } from '@/types/database';
import { createEmptyOpeningHours } from '@/lib/opening-hours';

interface FormData {
  // Business info
  name: string;
  category_id: string;
  description: string;

  // Address
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  location: string;

  // Contact
  phone: string;
  email: string;
  website: string;

  // Opening hours
  opening_hours: ExtendedOpeningHours;
  opening_hours_text: string;
  useStructuredHours: boolean;

  // Submitter info
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_phone: string;
}

const initialFormData: FormData = {
  name: '',
  category_id: '',
  description: '',
  street: '',
  house_number: '',
  postal_code: '15712',
  city: 'Zernsdorf',
  location: 'Zernsdorf',
  phone: '',
  email: '',
  website: '',
  opening_hours: createEmptyOpeningHours(),
  opening_hours_text: '',
  useStructuredHours: true,
  submitted_by_name: '',
  submitted_by_email: '',
  submitted_by_phone: '',
};

export default function SuggestPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // Honeypot field - should remain empty for real users
  const [honeypot, setHoneypot] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitData = {
        name: formData.name,
        category_id: formData.category_id || null,
        description: formData.description || null,
        street: formData.street || null,
        house_number: formData.house_number || null,
        postal_code: formData.postal_code,
        city: formData.city,
        location: formData.location,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        opening_hours: formData.useStructuredHours ? formData.opening_hours : null,
        opening_hours_text: !formData.useStructuredHours ? formData.opening_hours_text : null,
        submitted_by_name: formData.submitted_by_name || null,
        submitted_by_email: formData.submitted_by_email || null,
        submitted_by_phone: formData.submitted_by_phone || null,
        // Honeypot field
        website_url_confirm: honeypot,
      };

      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Senden des Vorschlags');
      }

      setSubmitSuccess(true);
      setFormData(initialFormData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen py-8 lg:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-900 mb-2">Vielen Dank!</h1>
            <p className="text-emerald-700 mb-6">
              Ihr Vorschlag wurde erfolgreich übermittelt. Er wird von uns geprüft und bei Freigabe
              in das Branchenverzeichnis aufgenommen.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setSubmitSuccess(false)}
                variant="outline"
                className="gap-2"
              >
                Weiteren Vorschlag senden
              </Button>
              <Link href="/de">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Zur Startseite
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/de"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Eintrag vorschlagen</h1>
              <p className="text-slate-600">
                Schlagen Sie ein Geschäft, einen Dienstleister oder eine Organisation für unser
                Branchenverzeichnis vor.
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">So funktioniert es:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Füllen Sie das Formular aus (Pflichtfelder sind markiert)</li>
              <li>Ihr Vorschlag wird von unserem Team geprüft</li>
              <li>Nach Freigabe erscheint der Eintrag im Verzeichnis</li>
            </ul>
          </div>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Fehler beim Senden</p>
              <p className="text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Grundinformationen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name des Eintrags *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Bäckerei Müller"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Bitte wählen...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung des Angebots..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </section>

          {/* Address Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Straße</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Hauptstraße"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hausnummer</label>
                <input
                  type="text"
                  value={formData.house_number}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                  placeholder="1a"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PLZ</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ort/Region</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Zernsdorf">Zernsdorf</option>
                  <option value="Königs Wusterhausen">Königs Wusterhausen</option>
                  <option value="Senzig">Senzig</option>
                  <option value="Kablow">Kablow</option>
                  <option value="Wildau">Wildau</option>
                </select>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Kontaktdaten des Eintrags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03375 123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@example.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.example.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </section>

          {/* Opening Hours Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Öffnungszeiten
            </h2>

            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.useStructuredHours}
                    onChange={() => setFormData({ ...formData, useStructuredHours: true })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Strukturierte Eingabe</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.useStructuredHours}
                    onChange={() => setFormData({ ...formData, useStructuredHours: false })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Freitext</span>
                </label>
              </div>
            </div>

            {formData.useStructuredHours ? (
              <OpeningHoursEditor
                value={formData.opening_hours}
                onChange={(hours) => setFormData({ ...formData, opening_hours: hours })}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Öffnungszeiten (Freitext)
                </label>
                <textarea
                  value={formData.opening_hours_text}
                  onChange={(e) => setFormData({ ...formData, opening_hours_text: e.target.value })}
                  placeholder="z.B. Mo-Fr 9-18 Uhr, Sa 9-13 Uhr"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
          </section>

          {/* Submitter Info Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Ihre Kontaktdaten (optional)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Falls wir Rückfragen zu Ihrem Vorschlag haben, können wir Sie kontaktieren.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ihr Name</label>
                <input
                  type="text"
                  value={formData.submitted_by_name}
                  onChange={(e) => setFormData({ ...formData, submitted_by_name: e.target.value })}
                  placeholder="Max Mustermann"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ihre E-Mail
                </label>
                <input
                  type="email"
                  value={formData.submitted_by_email}
                  onChange={(e) =>
                    setFormData({ ...formData, submitted_by_email: e.target.value })
                  }
                  placeholder="ihre@email.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </section>

          {/* Honeypot field - hidden from users */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website URL Confirmation (leave empty)
              <input
                type="text"
                name="website_url_confirm"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/de">
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Wird gesendet...' : 'Vorschlag absenden'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
