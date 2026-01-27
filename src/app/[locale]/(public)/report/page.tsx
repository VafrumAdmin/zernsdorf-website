'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  PenTool,
  AlertOctagon,
  Wrench,
  Trees,
  Construction,
  LightbulbOff,
  MoreHorizontal,
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Loader,
  X,
  Camera,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReportType {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
}

interface CleanlinessReport {
  id: string;
  report_type: string;
  title: string;
  description: string;
  images?: string[];
  location_description: string;
  street?: string;
  reporter_name?: string;
  anonymous: boolean;
  status: string;
  priority: string;
  reference_number?: string;
  created_at: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'trash-2': Trash2,
  'alert-triangle': AlertTriangle,
  'pen-tool': PenTool,
  'alert-octagon': AlertOctagon,
  tool: Wrench,
  trees: Trees,
  construction: Construction,
  'lightbulb-off': LightbulbOff,
  'more-horizontal': MoreHorizontal,
};

const statusInfo: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  new: { label: 'Neu', icon: Circle, color: 'text-blue-600' },
  acknowledged: { label: 'Bestätigt', icon: CheckCircle, color: 'text-indigo-600' },
  in_progress: { label: 'In Bearbeitung', icon: Loader, color: 'text-yellow-600' },
  resolved: { label: 'Erledigt', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Abgelehnt', icon: X, color: 'text-red-600' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function ReportPage() {
  const [reports, setReports] = useState<CleanlinessReport[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    report_type: '',
    title: '',
    description: '',
    location_description: '',
    street: '',
    reporter_name: '',
    reporter_email: '',
    reporter_phone: '',
    anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReportTypes();
    fetchReports();
  }, [filterType, filterStatus]);

  const fetchReportTypes = async () => {
    try {
      const res = await fetch('/api/report/types');
      if (res.ok) {
        const data = await res.json();
        setReportTypes(data);
      }
    } catch (error) {
      console.error('Error fetching report types:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/api/report';
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setFormData({
          report_type: '',
          title: '',
          description: '',
          location_description: '',
          street: '',
          reporter_name: '',
          reporter_email: '',
          reporter_phone: '',
          anonymous: false,
        });
        setTimeout(() => {
          setShowForm(false);
          setSubmitSuccess(false);
          fetchReports();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || MoreHorizontal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-10 h-10" />
            <h1 className="text-3xl md:text-4xl font-bold">Müll- & Sauberkeits-Melder</h1>
          </div>
          <p className="text-amber-100 text-lg">
            Melde Verschmutzungen, illegale Müllablagerungen und defekte Infrastruktur
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>Hinweis:</strong> Deine Meldung wird an die zuständige Stelle weitergeleitet.
            Bei dringenden Fällen (z.B. Gefahrenstellen) wende dich bitte direkt an die Gemeinde oder Polizei.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterType === null
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Alle Typen
            </button>
            {reportTypes.slice(0, 5).map((type) => {
              const Icon = getIcon(type.icon);
              return (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    filterType === type.name
                      ? 'text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  style={{
                    backgroundColor: filterType === type.name ? type.color : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {type.display_name}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Alle Status</option>
              {Object.entries(statusInfo).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <Button
              onClick={() => setShowForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Meldung
            </Button>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Laden...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Keine Meldungen gefunden</h3>
            <p className="text-slate-500 mb-4">
              Aktuell gibt es keine offenen Meldungen. Das ist gut!
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Problem melden
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const type = reportTypes.find((t) => t.name === report.report_type);
              const Icon = type ? getIcon(type.icon) : MoreHorizontal;
              const status = statusInfo[report.status] || statusInfo.new;
              const StatusIcon = status.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-stretch">
                    {/* Type Color Bar */}
                    <div
                      className="w-2 flex-shrink-0"
                      style={{ backgroundColor: type?.color || '#6B7280' }}
                    />

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${type?.color}20` || '#6B728020' }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{ color: type?.color || '#6B7280' }}
                            />
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-800">{report.title}</h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {report.description}
                            </p>

                            <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {report.location_description}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(report.created_at)}
                              </span>
                              {report.reference_number && (
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                                  #{report.reference_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Priority */}
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{status.label}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              priorityColors[report.priority] || priorityColors.normal
                            }`}
                          >
                            {report.priority === 'urgent'
                              ? 'Dringend'
                              : report.priority === 'high'
                              ? 'Hoch'
                              : report.priority === 'low'
                              ? 'Niedrig'
                              : 'Normal'}
                          </span>
                        </div>
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
            {submitSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Meldung eingegangen!</h2>
                <p className="text-slate-600">
                  Vielen Dank für deine Meldung. Sie wird schnellstmöglich bearbeitet.
                </p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-800">Problem melden</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Art des Problems *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {reportTypes.map((type) => {
                        const Icon = getIcon(type.icon);
                        const isSelected = formData.report_type === type.name;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, report_type: type.name })}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${isSelected ? '' : 'text-slate-500'}`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                isSelected ? 'text-amber-700' : 'text-slate-600'
                              }`}
                            >
                              {type.display_name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kurze Beschreibung *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="z.B. Illegale Müllablagerung am Waldrand"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Detaillierte Beschreibung *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Beschreibe das Problem genauer..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ort / Standort *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location_description}
                        onChange={(e) =>
                          setFormData({ ...formData, location_description: e.target.value })
                        }
                        placeholder="z.B. Am Spielplatz Friedensaue"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Straße (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="z.B. Friedensaue 12"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-700">Kontaktdaten (optional)</h3>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.anonymous}
                          onChange={(e) =>
                            setFormData({ ...formData, anonymous: e.target.checked })
                          }
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        Anonym melden
                      </label>
                    </div>

                    {!formData.anonymous && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={formData.reporter_name}
                            onChange={(e) =>
                              setFormData({ ...formData, reporter_name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            E-Mail
                          </label>
                          <input
                            type="email"
                            value={formData.reporter_email}
                            onChange={(e) =>
                              setFormData({ ...formData, reporter_email: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={formData.reporter_phone}
                            onChange={(e) =>
                              setFormData({ ...formData, reporter_phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
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
                    <Button
                      type="submit"
                      disabled={submitting || !formData.report_type}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Senden...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Meldung absenden
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
