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
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OpeningHoursEditor } from '@/components/OpeningHoursEditor';
import { ImageUpload, MultiImageUpload } from '@/components/ui/ImageUpload';
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

  // Messenger
  has_whatsapp: boolean;
  has_telegram: boolean;
  has_signal: boolean;

  // Opening hours
  opening_hours: ExtendedOpeningHours;
  opening_hours_text: string;
  useStructuredHours: boolean;

  // Images
  logo_url: string;
  pending_images: string[];

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
  has_whatsapp: false,
  has_telegram: false,
  has_signal: false,
  opening_hours: createEmptyOpeningHours(),
  opening_hours_text: '',
  useStructuredHours: true,
  logo_url: '',
  pending_images: [],
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
        has_whatsapp: formData.has_whatsapp,
        has_telegram: formData.has_telegram,
        has_signal: formData.has_signal,
        opening_hours: formData.useStructuredHours ? formData.opening_hours : null,
        opening_hours_text: !formData.useStructuredHours ? formData.opening_hours_text : null,
        logo_url: formData.logo_url || null,
        pending_images: formData.pending_images.length > 0 ? formData.pending_images : null,
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

              {/* Messenger Options */}
              {formData.phone && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Erreichbar über Messenger (auf der Telefonnummer)
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_whatsapp}
                        onChange={(e) => setFormData({ ...formData, has_whatsapp: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-slate-700">
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_telegram}
                        onChange={(e) => setFormData({ ...formData, has_telegram: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-slate-700">
                        <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_signal}
                        onChange={(e) => setFormData({ ...formData, has_signal: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-slate-700">
                        <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4 0 4.636-3.764 8.4-8.4 8.4-4.636 0-8.4-3.764-8.4-8.4 0-4.636 3.764-8.4 8.4-8.4zm0 2.4a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>
                        </svg>
                        Signal
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Wählen Sie die Messenger, über die der Eintrag auf der angegebenen Telefonnummer erreichbar ist.
                  </p>
                </div>
              )}
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

          {/* Images Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              Bilder (optional)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Laden Sie ein Logo und Bilder hoch. Die Bilder werden nach Prüfung durch unser Team freigeschaltet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ImageUpload
                  type="logo"
                  currentImage={formData.logo_url || undefined}
                  onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                  onRemove={() => setFormData({ ...formData, logo_url: '' })}
                  label="Logo"
                />
              </div>
              <div>
                <MultiImageUpload
                  images={formData.pending_images}
                  onImagesChange={(images) => setFormData({ ...formData, pending_images: images })}
                  maxImages={5}
                  label="Galeriebilder"
                />
              </div>
            </div>
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
