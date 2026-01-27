'use client';

import { useState, useEffect } from 'react';
import {
  Dog,
  Cat,
  Bird,
  Rabbit,
  Search,
  Plus,
  MapPin,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Eye,
  Share2,
  X,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PetAlert {
  id: string;
  alert_type: 'lost' | 'found' | 'sighting' | 'rehome';
  pet_type: string;
  pet_name?: string;
  pet_breed?: string;
  pet_color?: string;
  pet_size?: string;
  pet_distinctive_features?: string;
  description: string;
  images?: string[];
  last_seen_location?: string;
  last_seen_date?: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  is_urgent: boolean;
  views_count: number;
  created_at: string;
}

const petTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  other: Heart,
};

const alertTypeLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  lost: { label: 'Vermisst', color: 'text-red-700', bgColor: 'bg-red-100' },
  found: { label: 'Gefunden', color: 'text-green-700', bgColor: 'bg-green-100' },
  sighting: { label: 'Gesichtet', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  rehome: { label: 'Sucht Zuhause', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const petTypeLabels: Record<string, string> = {
  dog: 'Hund',
  cat: 'Katze',
  bird: 'Vogel',
  rabbit: 'Kaninchen',
  other: 'Anderes Tier',
};

export default function PetsPage() {
  const [alerts, setAlerts] = useState<PetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPet, setFilterPet] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: 'lost',
    pet_type: 'dog',
    pet_name: '',
    pet_breed: '',
    pet_color: '',
    pet_size: 'medium',
    pet_distinctive_features: '',
    description: '',
    last_seen_location: '',
    last_seen_date: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    is_urgent: false,
  });

  useEffect(() => {
    fetchAlerts();
  }, [filterType, filterPet]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = '/api/pets';
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterPet) params.append('pet', filterPet);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          alert_type: 'lost',
          pet_type: 'dog',
          pet_name: '',
          pet_breed: '',
          pet_color: '',
          pet_size: 'medium',
          pet_distinctive_features: '',
          description: '',
          last_seen_location: '',
          last_seen_date: '',
          contact_name: '',
          contact_phone: '',
          contact_email: '',
          is_urgent: false,
        });
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-10 h-10" />
            <h1 className="text-3xl md:text-4xl font-bold">Haustier-SOS</h1>
          </div>
          <p className="text-rose-100 text-lg">
            Vermisste Tiere melden, gefundene Tiere registrieren, Nachbarn helfen
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Alert Type Filter */}
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterType === null
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Alle
            </button>
            {Object.entries(alertTypeLabels).map(([key, { label, bgColor }]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterType === key
                    ? 'bg-rose-600 text-white'
                    : `${bgColor} text-slate-700 hover:opacity-80`
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Pet Type Filter */}
            {Object.entries(petTypeIcons).map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => setFilterPet(filterPet === key ? null : key)}
                className={`p-2 rounded-full transition-all ${
                  filterPet === key
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title={petTypeLabels[key]}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Meldung erstellen
          </Button>
        </div>

        {/* Urgent Alerts Banner */}
        {alerts.some((a) => a.is_urgent && a.alert_type === 'lost') && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertTriangle className="w-5 h-5" />
              Dringend vermisst!
            </div>
            <div className="flex flex-wrap gap-2">
              {alerts
                .filter((a) => a.is_urgent && a.alert_type === 'lost')
                .map((alert) => (
                  <span
                    key={alert.id}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                  >
                    {alert.pet_name || petTypeLabels[alert.pet_type]} - {alert.last_seen_location}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Alerts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Laden...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Keine Meldungen gefunden</h3>
            <p className="text-slate-500 mb-4">Aktuell gibt es keine Tiermeldungen in deiner Nähe.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => {
              const PetIcon = petTypeIcons[alert.pet_type] || Heart;
              const typeInfo = alertTypeLabels[alert.alert_type];
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                    alert.is_urgent ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-100'
                  }`}
                >
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${typeInfo.bgColor}`}>
                    <div className="flex items-center gap-2">
                      <PetIcon className={`w-5 h-5 ${typeInfo.color}`} />
                      <span className={`font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                    </div>
                    {alert.is_urgent && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Dringend
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Pet Info */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {alert.pet_name || petTypeLabels[alert.pet_type]}
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1 mt-1">
                        {alert.pet_breed && <p>Rasse: {alert.pet_breed}</p>}
                        {alert.pet_color && <p>Farbe: {alert.pet_color}</p>}
                        {alert.pet_distinctive_features && (
                          <p>Merkmale: {alert.pet_distinctive_features}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{alert.description}</p>

                    {/* Location & Time */}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                      {alert.last_seen_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.last_seen_location}
                        </span>
                      )}
                      {alert.last_seen_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(alert.last_seen_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {alert.views_count}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-sm font-medium text-slate-700">Kontakt: {alert.contact_name}</p>
                      <div className="flex gap-2">
                        {alert.contact_phone && (
                          <a
                            href={`tel:${alert.contact_phone}`}
                            className="flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200"
                          >
                            <Phone className="w-3 h-3" />
                            Anrufen
                          </a>
                        )}
                        {alert.contact_email && (
                          <a
                            href={`mailto:${alert.contact_email}`}
                            className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                          >
                            <Mail className="w-3 h-3" />
                            E-Mail
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Neue Tiermeldung</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meldungstyp *</label>
                  <select
                    required
                    value={formData.alert_type}
                    onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="lost">Vermisst</option>
                    <option value="found">Gefunden</option>
                    <option value="sighting">Gesichtet</option>
                    <option value="rehome">Sucht Zuhause</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tierart *</label>
                  <select
                    required
                    value={formData.pet_type}
                    onChange={(e) => setFormData({ ...formData, pet_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="dog">Hund</option>
                    <option value="cat">Katze</option>
                    <option value="bird">Vogel</option>
                    <option value="rabbit">Kaninchen</option>
                    <option value="other">Anderes Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name des Tieres</label>
                  <input
                    type="text"
                    value={formData.pet_name}
                    onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                    placeholder="z.B. Bello"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rasse</label>
                  <input
                    type="text"
                    value={formData.pet_breed}
                    onChange={(e) => setFormData({ ...formData, pet_breed: e.target.value })}
                    placeholder="z.B. Labrador"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Farbe</label>
                  <input
                    type="text"
                    value={formData.pet_color}
                    onChange={(e) => setFormData({ ...formData, pet_color: e.target.value })}
                    placeholder="z.B. Schwarz-weiß"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Größe</label>
                  <select
                    value={formData.pet_size}
                    onChange={(e) => setFormData({ ...formData, pet_size: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="small">Klein</option>
                    <option value="medium">Mittel</option>
                    <option value="large">Groß</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Besondere Merkmale</label>
                <input
                  type="text"
                  value={formData.pet_distinctive_features}
                  onChange={(e) => setFormData({ ...formData, pet_distinctive_features: e.target.value })}
                  placeholder="z.B. Narbe am Ohr, trägt rotes Halsband"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Weitere Details zur Situation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zuletzt gesehen - Ort</label>
                  <input
                    type="text"
                    value={formData.last_seen_location}
                    onChange={(e) => setFormData({ ...formData, last_seen_location: e.target.value })}
                    placeholder="z.B. Nähe Bahnhof Zernsdorf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zuletzt gesehen - Datum</label>
                  <input
                    type="date"
                    value={formData.last_seen_date}
                    onChange={(e) => setFormData({ ...formData, last_seen_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-medium text-slate-700 mb-3">Kontaktdaten</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="is_urgent" className="text-sm text-slate-700">
                  Dringende Meldung (z.B. verletztes Tier, gerade entlaufen)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700">
                  Meldung veröffentlichen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
