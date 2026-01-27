'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Search,
  Calendar,
  Eye,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';

interface Factcheck {
  id: string;
  claim_title: string;
  claim_text: string;
  claim_source?: string;
  claim_date?: string;
  verdict: string;
  verdict_summary: string;
  explanation: string;
  sources?: { title: string; url: string; date?: string }[];
  category?: string;
  tags?: string[];
  author_name?: string;
  views_count: number;
  published_at: string;
}

const verdictInfo: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  true: { label: 'Wahr', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  mostly_true: { label: 'Größtenteils wahr', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  partly_true: { label: 'Teilweise wahr', icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  mostly_false: { label: 'Größtenteils falsch', icon: XCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  false: { label: 'Falsch', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  unverifiable: { label: 'Nicht überprüfbar', icon: HelpCircle, color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const categoryLabels: Record<string, string> = {
  local: 'Lokales',
  politics: 'Politik',
  health: 'Gesundheit',
  environment: 'Umwelt',
  traffic: 'Verkehr',
  other: 'Sonstiges',
};

export default function FactcheckPage() {
  const [factchecks, setFactchecks] = useState<Factcheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVerdict, setFilterVerdict] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFactchecks();
  }, [filterVerdict, filterCategory]);

  const fetchFactchecks = async () => {
    setLoading(true);
    try {
      let url = '/api/factcheck';
      const params = new URLSearchParams();
      if (filterVerdict) params.append('verdict', filterVerdict);
      if (filterCategory) params.append('category', filterCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFactchecks(data);
      }
    } catch (error) {
      console.error('Error fetching factchecks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredFactchecks = factchecks.filter((fc) =>
    searchQuery
      ? fc.claim_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fc.claim_text.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10" />
            <h1 className="text-3xl md:text-4xl font-bold">Faktencheck-Archiv</h1>
          </div>
          <p className="text-indigo-100 text-lg">
            Überprüfte Behauptungen und Gerüchte aus der Region
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Behauptung suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Verdict Filter */}
            <select
              value={filterVerdict || ''}
              onChange={(e) => setFilterVerdict(e.target.value || null)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Alle Bewertungen</option>
              {Object.entries(verdictInfo).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Alle Kategorien</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verdict Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(verdictInfo).map(([key, { label, icon: Icon, color, bgColor }]) => (
            <div
              key={key}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${bgColor} ${color}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </div>

        {/* Factchecks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Laden...</p>
          </div>
        ) : filteredFactchecks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Keine Faktenchecks gefunden</h3>
            <p className="text-slate-500">
              {searchQuery
                ? 'Versuche es mit einem anderen Suchbegriff.'
                : 'Es wurden noch keine Faktenchecks veröffentlicht.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFactchecks.map((fc) => {
              const verdict = verdictInfo[fc.verdict] || verdictInfo.unverifiable;
              const VerdictIcon = verdict.icon;
              const isExpanded = expandedId === fc.id;

              return (
                <div
                  key={fc.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  {/* Header - Always visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : fc.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Verdict Badge */}
                      <div
                        className={`flex-shrink-0 p-3 rounded-full ${verdict.bgColor}`}
                      >
                        <VerdictIcon className={`w-6 h-6 ${verdict.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Claim Title */}
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          &ldquo;{fc.claim_title}&rdquo;
                        </h3>

                        {/* Verdict Summary */}
                        <p className={`text-sm font-medium ${verdict.color} mb-2`}>
                          {verdict.label}: {fc.verdict_summary}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {fc.category && (
                            <span className="bg-slate-100 px-2 py-1 rounded">
                              {categoryLabels[fc.category] || fc.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(fc.published_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {fc.views_count} Aufrufe
                          </span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="flex-shrink-0 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <div className="pt-4 pl-16">
                        {/* Original Claim */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-1">
                            Die Behauptung:
                          </h4>
                          <blockquote className="border-l-4 border-slate-300 pl-3 text-slate-600 italic">
                            {fc.claim_text}
                          </blockquote>
                          {fc.claim_source && (
                            <p className="text-xs text-slate-500 mt-1">
                              Quelle: {fc.claim_source}
                              {fc.claim_date && ` (${formatDate(fc.claim_date)})`}
                            </p>
                          )}
                        </div>

                        {/* Explanation */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-1">
                            Unsere Einschätzung:
                          </h4>
                          <p className="text-slate-600 whitespace-pre-line">{fc.explanation}</p>
                        </div>

                        {/* Sources */}
                        {fc.sources && fc.sources.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Quellen:</h4>
                            <ul className="space-y-1">
                              {fc.sources.map((source, idx) => (
                                <li key={idx}>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {source.title}
                                    {source.date && ` (${source.date})`}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tags */}
                        {fc.tags && fc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {fc.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Author */}
                        {fc.author_name && (
                          <p className="text-xs text-slate-500 mt-4">
                            Geprüft von: {fc.author_name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-indigo-50 rounded-xl p-6">
          <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Über unser Faktencheck-Archiv
          </h3>
          <p className="text-indigo-700 text-sm">
            Wir überprüfen Behauptungen und Gerüchte, die in der Region kursieren.
            Unser Ziel ist es, Falschinformationen zu identifizieren und korrekte Informationen bereitzustellen.
            Haben Sie eine Behauptung, die wir prüfen sollen? Kontaktieren Sie uns über das Kontaktformular.
          </p>
        </div>
      </div>
    </div>
  );
}
