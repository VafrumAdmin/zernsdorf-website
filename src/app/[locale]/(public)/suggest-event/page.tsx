'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowLeft,
  MapPin,
  User,
  Image as ImageIcon,
  Clock,
  Repeat,
  Building2,
  Globe,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageUpload, MultiImageUpload } from '@/components/ui/ImageUpload';
import { RecurrenceEditor } from '@/components/events/RecurrenceEditor';
import type { Business, EventCategory, EventType } from '@/types/database';

interface FormData {
  // Basic info
  title: string;
  description: string;
  event_type: EventType;
  category: EventCategory;

  // Date & Time
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;

  // Recurrence (for courses)
  is_recurring: boolean;
  recurrence_rule: string;
  recurrence_end_date: string;

  // Location
  location_source: 'freetext' | 'business';
  location_name: string;
  location_address: string;
  location_business_id: string;

  // Organizer
  organizer_source: 'freetext' | 'business';
  organizer_name: string;
  organizer_contact_email: string;
  organizer_contact_phone: string;
  organizer_business_id: string;

  // Images
  image_url: string;
  images: string[];

  // Contact & Links
  website: string;

  // Registration
  requires_registration: boolean;
  max_participants: string;
  registration_url: string;

  // Submitter info
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_by_phone: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  event_type: 'single',
  category: 'community',

  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  is_all_day: false,

  is_recurring: false,
  recurrence_rule: '',
  recurrence_end_date: '',

  location_source: 'freetext',
  location_name: '',
  location_address: '',
  location_business_id: '',

  organizer_source: 'freetext',
  organizer_name: '',
  organizer_contact_email: '',
  organizer_contact_phone: '',
  organizer_business_id: '',

  image_url: '',
  images: [],

  website: '',

  requires_registration: false,
  max_participants: '',
  registration_url: '',

  submitted_by_name: '',
  submitted_by_email: '',
  submitted_by_phone: '',
};

const eventCategories: { value: EventCategory; label: string; icon: string }[] = [
  { value: 'festival', label: 'Fest / Feier', icon: '🎉' },
  { value: 'market', label: 'Markt', icon: '🛒' },
  { value: 'culture', label: 'Kultur / Konzert', icon: '🎭' },
  { value: 'sports', label: 'Sport', icon: '⚽' },
  { value: 'community', label: 'Gemeinde / Treffen', icon: '🤝' },
  { value: 'course', label: 'Kurs', icon: '📚' },
  { value: 'workshop', label: 'Workshop', icon: '🔧' },
  { value: 'official', label: 'Amtlich / Politik', icon: '🏛️' },
  { value: 'other', label: 'Sonstiges', icon: '📌' },
];

export default function SuggestEventPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessSearch, setBusinessSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Fetch businesses for dropdown
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch('/api/businesses?limit=100');
        const data = await res.json();
        setBusinesses(data.businesses || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    }
    fetchBusinesses();
  }, []);

  // Filter businesses based on search
  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(businessSearch.toLowerCase())
  );

  // Handle recurrence change
  const handleRecurrenceChange = useCallback((rrule: string | null, endDate: string | null) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_rule: rrule || '',
      recurrence_end_date: endDate || '',
    }));
  }, []);

  // Auto-fill organizer contact when selecting business
  useEffect(() => {
    if (formData.organizer_source === 'business' && formData.organizer_business_id) {
      const business = businesses.find((b) => b.id === formData.organizer_business_id);
      if (business) {
        setFormData((prev) => ({
          ...prev,
          organizer_contact_email: business.email || '',
          organizer_contact_phone: business.phone || '',
        }));
      }
    }
  }, [formData.organizer_business_id, formData.organizer_source, businesses]);

  // Auto-fill location when selecting business
  useEffect(() => {
    if (formData.location_source === 'business' && formData.location_business_id) {
      const business = businesses.find((b) => b.id === formData.location_business_id);
      if (business) {
        const address = [
          business.street,
          business.house_number,
          business.postal_code,
          business.city,
        ]
          .filter(Boolean)
          .join(' ');
        setFormData((prev) => ({
          ...prev,
          location_address: address,
        }));
      }
    }
  }, [formData.location_business_id, formData.location_source, businesses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        category: formData.category,

        start_date: formData.start_date,
        start_time: formData.start_time || null,
        end_date: formData.end_date || null,
        end_time: formData.end_time || null,
        is_all_day: formData.is_all_day,

        is_recurring: formData.is_recurring,
        recurrence_rule: formData.is_recurring ? formData.recurrence_rule : null,
        recurrence_end_date: formData.is_recurring ? formData.recurrence_end_date : null,

        location_name:
          formData.location_source === 'freetext' ? formData.location_name : null,
        location_address:
          formData.location_source === 'freetext' ? formData.location_address : null,
        location_business_id:
          formData.location_source === 'business' ? formData.location_business_id : null,

        organizer_name:
          formData.organizer_source === 'freetext' ? formData.organizer_name : null,
        organizer_contact_email: formData.organizer_contact_email || null,
        organizer_contact_phone: formData.organizer_contact_phone || null,
        organizer_business_id:
          formData.organizer_source === 'business' ? formData.organizer_business_id : null,

        image_url: formData.image_url || null,
        images: formData.images.length > 0 ? formData.images : null,

        website: formData.website || null,

        requires_registration: formData.requires_registration,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants, 10)
          : null,
        registration_url: formData.registration_url || null,

        submitted_by_name: formData.submitted_by_name || null,
        submitted_by_email: formData.submitted_by_email || null,
        submitted_by_phone: formData.submitted_by_phone || null,

        // Honeypot
        website_url_confirm: honeypot,
      };

      const res = await fetch('/api/event-suggestions', {
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
      setSubmitError(
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
      );
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
              Ihr Veranstaltungsvorschlag wurde erfolgreich übermittelt. Er wird von uns
              geprüft und bei Freigabe im Kalender veröffentlicht.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setSubmitSuccess(false)}
                variant="outline"
                className="gap-2"
              >
                Weiteren Vorschlag senden
              </Button>
              <Link href="/de/events">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Calendar className="w-4 h-4" />
                  Zum Kalender
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
            href="/de/events"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Veranstaltungen
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Veranstaltung vorschlagen</h1>
              <p className="text-slate-600">
                Schlagen Sie eine Veranstaltung, einen Kurs oder ein Event für unseren
                Kalender vor.
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
              <li>Nach Freigabe erscheint die Veranstaltung im Kalender</li>
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
              <Calendar className="w-5 h-5 text-purple-600" />
              Grundinformationen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titel der Veranstaltung *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Yoga-Kurs für Anfänger"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as EventCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {eventCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Event-Typ
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({ ...formData, event_type: e.target.value as EventType })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="single">Einmalig</option>
                    <option value="recurring">Wiederkehrend (Kurs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreiben Sie die Veranstaltung..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </section>

          {/* Date & Time Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Datum & Uhrzeit
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="is_all_day"
                  checked={formData.is_all_day}
                  onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_all_day" className="text-sm text-slate-700">
                  Ganztägig
                </label>
              </div>

              {!formData.is_all_day && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Startzeit
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Endzeit
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Recurrence for courses */}
              {formData.event_type === 'recurring' && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Repeat className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-slate-900">Wiederholung</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) =>
                        setFormData({ ...formData, is_recurring: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="is_recurring" className="text-sm text-slate-700">
                      Wiederkehrende Veranstaltung einrichten
                    </label>
                  </div>
                  {formData.is_recurring && (
                    <RecurrenceEditor
                      value={formData.recurrence_rule}
                      endDate={formData.recurrence_end_date}
                      onChange={handleRecurrenceChange}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Location Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Veranstaltungsort
            </h2>

            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.location_source === 'freetext'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        location_source: 'freetext',
                        location_business_id: '',
                      })
                    }
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">Freitext eingeben</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.location_source === 'business'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        location_source: 'business',
                        location_name: '',
                        location_address: '',
                      })
                    }
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">Aus Verzeichnis wählen</span>
                </label>
              </div>
            </div>

            {formData.location_source === 'freetext' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ortsname
                  </label>
                  <input
                    type="text"
                    value={formData.location_name}
                    onChange={(e) =>
                      setFormData({ ...formData, location_name: e.target.value })
                    }
                    placeholder="z.B. Bürgerhaus Zernsdorf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.location_address}
                    onChange={(e) =>
                      setFormData({ ...formData, location_address: e.target.value })
                    }
                    placeholder="Straße Nr., PLZ Ort"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Ort aus Verzeichnis
                  </label>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                  />
                  <select
                    value={formData.location_business_id}
                    onChange={(e) =>
                      setFormData({ ...formData, location_business_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Bitte wählen...</option>
                    {filteredBusinesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                        {b.location ? ` (${b.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.location_business_id && formData.location_address && (
                  <p className="text-sm text-slate-500">
                    Adresse: {formData.location_address}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Organizer Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Veranstalter
            </h2>

            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.organizer_source === 'freetext'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        organizer_source: 'freetext',
                        organizer_business_id: '',
                      })
                    }
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">Eigene Angaben</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.organizer_source === 'business'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        organizer_source: 'business',
                        organizer_name: '',
                      })
                    }
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">Aus Verzeichnis wählen</span>
                </label>
              </div>
            </div>

            {formData.organizer_source === 'freetext' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name des Veranstalters
                  </label>
                  <input
                    type="text"
                    value={formData.organizer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer_name: e.target.value })
                    }
                    placeholder="z.B. Sportverein Zernsdorf e.V."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={formData.organizer_contact_email}
                      onChange={(e) =>
                        setFormData({ ...formData, organizer_contact_email: e.target.value })
                      }
                      placeholder="kontakt@example.de"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.organizer_contact_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, organizer_contact_phone: e.target.value })
                      }
                      placeholder="03375 123456"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Veranstalter aus Verzeichnis
                  </label>
                  <select
                    value={formData.organizer_business_id}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer_business_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Bitte wählen...</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.organizer_business_id && (
                  <div className="text-sm text-slate-500 space-y-1">
                    {formData.organizer_contact_email && (
                      <p>E-Mail: {formData.organizer_contact_email}</p>
                    )}
                    {formData.organizer_contact_phone && (
                      <p>Telefon: {formData.organizer_contact_phone}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Images Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Bilder (optional)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Laden Sie ein Plakat oder Bilder zur Veranstaltung hoch.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ImageUpload
                  type="image"
                  currentImage={formData.image_url || undefined}
                  onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  onRemove={() => setFormData({ ...formData, image_url: '' })}
                  label="Hauptbild / Plakat"
                />
              </div>
              <div>
                <MultiImageUpload
                  images={formData.images}
                  onImagesChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  maxImages={5}
                  label="Weitere Bilder"
                />
              </div>
            </div>
          </section>

          {/* Additional Info Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              Weitere Informationen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website / Link
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.example.de"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="requires_registration"
                    checked={formData.requires_registration}
                    onChange={(e) =>
                      setFormData({ ...formData, requires_registration: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="requires_registration" className="text-sm text-slate-700">
                    Anmeldung erforderlich
                  </label>
                </div>

                {formData.requires_registration && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Max. Teilnehmer
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_participants}
                        onChange={(e) =>
                          setFormData({ ...formData, max_participants: e.target.value })
                        }
                        placeholder="z.B. 20"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Anmeldelink
                      </label>
                      <input
                        type="url"
                        value={formData.registration_url}
                        onChange={(e) =>
                          setFormData({ ...formData, registration_url: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Submitter Info Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Ihre Kontaktdaten (optional)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Falls wir Rückfragen zu Ihrem Vorschlag haben, können wir Sie kontaktieren.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ihr Name
                </label>
                <input
                  type="text"
                  value={formData.submitted_by_name}
                  onChange={(e) =>
                    setFormData({ ...formData, submitted_by_name: e.target.value })
                  }
                  placeholder="Max Mustermann"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            <Link href="/de/events">
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
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
