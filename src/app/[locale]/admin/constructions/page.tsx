'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Construction,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  Ban,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Types
type ConstructionType = 'road' | 'highway' | 'rail' | 'bridge' | 'utility' | 'other';
type ConstructionStatus = 'planned' | 'active' | 'completed' | 'cancelled';
type ConstructionImpactLevel = 'low' | 'medium' | 'high' | 'critical';

interface DBConstruction {
  id: string;
  title: string;
  description: string | null;
  location: string;
  type: ConstructionType;
  category: string | null;
  start_date: string;
  end_date: string | null;
  status: ConstructionStatus;
  impact_level: ConstructionImpactLevel;
  traffic_impact: string | null;
  detour_info: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  source_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<ConstructionType, string> = {
  road: 'Straße',
  highway: 'Autobahn',
  rail: 'Bahn',
  bridge: 'Brücke',
  utility: 'Versorgung',
  other: 'Sonstiges',
};

const STATUS_LABELS: Record<ConstructionStatus, string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
};

const IMPACT_LABELS: Record<ConstructionImpactLevel, string> = {
  low: 'Gering',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

const STATUS_COLORS: Record<ConstructionStatus, string> = {
  planned: 'bg-yellow-100 text-yellow-800',
  active: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const IMPACT_COLORS: Record<ConstructionImpactLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const CATEGORIES = ['Zernsdorf', 'KW', 'LDS', 'A10', 'A12', 'A13', 'Bahn', 'Sonstiges'];

export default function ConstructionsAdminPage() {
  const [constructions, setConstructions] = useState<DBConstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<ConstructionStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Edit Modal
  const [editingConstruction, setEditingConstruction] = useState<DBConstruction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<Partial<DBConstruction>>({});

  const fetchConstructions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/constructions?all=true');
      const data = await res.json();
      setConstructions(data.constructions || []);
    } catch (err) {
      setError('Fehler beim Laden der Baustellen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConstructions();
  }, [fetchConstructions]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingConstruction
        ? `/api/constructions/${editingConstruction.id}`
        : '/api/constructions';
      const method = editingConstruction ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');

      await fetchConstructions();
      setEditingConstruction(null);
      setShowAddModal(false);
      setFormData({});
    } catch (err) {
      setError('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Baustelle wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/constructions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      await fetchConstructions();
    } catch (err) {
      setError('Fehler beim Löschen');
    }
  };

  const openEditModal = (construction: DBConstruction) => {
    setEditingConstruction(construction);
    setFormData({ ...construction });
  };

  const openAddModal = () => {
    setEditingConstruction(null);
    setFormData({
      type: 'road',
      status: 'planned',
      impact_level: 'medium',
      is_visible: true,
      is_featured: false,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setEditingConstruction(null);
    setShowAddModal(false);
    setFormData({});
  };

  // Filtered constructions
  const filteredConstructions = constructions.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  // Stats
  const activeCount = constructions.filter(c => c.status === 'active').length;
  const plannedCount = constructions.filter(c => c.status === 'planned').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Construction className="w-6 h-6" />
                Baustellen verwalten
              </h1>
              <p className="text-slate-600 mt-1">
                {activeCount} aktiv, {plannedCount} geplant
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchConstructions} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Baustelle
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ConstructionStatus | 'all')}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">Alle</option>
                <option value="active">Aktiv</option>
                <option value="planned">Geplant</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgebrochen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">Alle</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConstructions.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border border-slate-200 p-5 ${!c.is_visible ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{c.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${IMPACT_COLORS[c.impact_level]}`}>
                        {IMPACT_LABELS[c.impact_level]}
                      </span>
                      {c.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {c.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{c.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.start_date).toLocaleDateString('de-DE')}
                        {c.end_date && ` – ${new Date(c.end_date).toLocaleDateString('de-DE')}`}
                      </span>
                      {c.source && (
                        <span className="flex items-center gap-1">
                          Quelle: {c.source}
                        </span>
                      )}
                    </div>
                    {c.traffic_impact && (
                      <p className="text-xs text-orange-600 mt-2">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {c.traffic_impact}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredConstructions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Construction className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Keine Baustellen gefunden</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {(editingConstruction || showAddModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">
                  {editingConstruction ? 'Baustelle bearbeiten' : 'Neue Baustelle'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ort *</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                    <select
                      value={formData.type || 'road'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ConstructionType })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Wählen --</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start *</label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ende</label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'planned'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ConstructionStatus })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Auswirkung</label>
                    <select
                      value={formData.impact_level || 'medium'}
                      onChange={(e) => setFormData({ ...formData, impact_level: e.target.value as ConstructionImpactLevel })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {Object.entries(IMPACT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Verkehrsauswirkung</label>
                  <input
                    type="text"
                    value={formData.traffic_impact || ''}
                    onChange={(e) => setFormData({ ...formData, traffic_impact: e.target.value })}
                    placeholder="z.B. Halbseitige Sperrung, 80 km/h"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Umleitung</label>
                  <input
                    type="text"
                    value={formData.detour_info || ''}
                    onChange={(e) => setFormData({ ...formData, detour_info: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quelle</label>
                    <input
                      type="text"
                      value={formData.source || ''}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quell-URL</label>
                    <input
                      type="url"
                      value={formData.source_url || ''}
                      onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_visible ?? true}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                    />
                    <span className="text-sm">Sichtbar</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured ?? false}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <span className="text-sm">Hervorgehoben</span>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
