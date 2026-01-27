'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Users,
  Plus,
  ChevronLeft,
  Search,
  MoreVertical,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  X,
  Check,
  Loader2,
  Globe,
  Lock,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Group {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  avatar_url: string | null;
  color: string;
  is_public: boolean;
  is_open: boolean;
  requires_approval: boolean;
  is_active: boolean;
  is_verified: boolean;
  members_count: number;
  posts_count: number;
  contact_email: string | null;
  website: string | null;
  created_at: string;
}

export default function AdminGroupsPage() {
  const supabase = createClient();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#10B981',
    is_public: true,
    is_open: true,
    requires_approval: false,
    contact_email: '',
    website: '',
  });

  useEffect(() => {
    loadGroups();
  }, [searchQuery]);

  const loadGroups = async () => {
    setIsLoading(true);

    let query = supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (data && !error) {
      setGroups(data);
    }

    setIsLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('groups')
      .insert({
        name: formData.name.toLowerCase().replace(/\s+/g, '-'),
        display_name: formData.display_name,
        description: formData.description || null,
        color: formData.color,
        is_public: formData.is_public,
        is_open: formData.is_open,
        requires_approval: formData.requires_approval,
        contact_email: formData.contact_email || null,
        website: formData.website || null,
      });

    if (!error) {
      setShowCreateModal(false);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        color: '#10B981',
        is_public: true,
        is_open: true,
        requires_approval: false,
        contact_email: '',
        website: '',
      });
      await loadGroups();
    }

    setSaving(false);
  };

  const toggleGroupStatus = async (groupId: string, isActive: boolean) => {
    setSaving(true);
    await supabase
      .from('groups')
      .update({ is_active: !isActive })
      .eq('id', groupId);
    await loadGroups();
    setSaving(false);
  };

  const toggleGroupVerified = async (groupId: string, isVerified: boolean) => {
    setSaving(true);
    await supabase
      .from('groups')
      .update({ is_verified: !isVerified })
      .eq('id', groupId);
    await loadGroups();
    setSaving(false);
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Möchten Sie diese Gruppe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setSaving(true);
    await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
    await loadGroups();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück zum Admin-Bereich
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-600" />
              Gruppenverwaltung
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neue Gruppe
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gruppen suchen..."
              className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Keine Gruppen vorhanden
            </h3>
            <p className="text-slate-600 mb-6">
              Erstellen Sie die erste Gruppe für Vereine oder Communities.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Neue Gruppe erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  group.is_active ? 'border-slate-200' : 'border-red-200 bg-red-50/50'
                }`}
              >
                {/* Header */}
                <div
                  className="h-20 relative"
                  style={{ backgroundColor: group.color }}
                >
                  {group.avatar_url && (
                    <img
                      src={group.avatar_url}
                      alt=""
                      className="absolute bottom-0 left-4 w-16 h-16 rounded-xl border-4 border-white transform translate-y-1/2 object-cover bg-white"
                    />
                  )}
                  {!group.avatar_url && (
                    <div className="absolute bottom-0 left-4 w-16 h-16 rounded-xl border-4 border-white transform translate-y-1/2 bg-white flex items-center justify-center">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {group.is_verified && (
                      <span className="px-2 py-1 bg-white/90 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verifiziert
                      </span>
                    )}
                    {!group.is_active && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        Deaktiviert
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="pt-10 px-4 pb-4">
                  <h3 className="font-semibold text-slate-900">{group.display_name}</h3>
                  <p className="text-sm text-slate-500 mb-3">@{group.name}</p>

                  {group.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span>{group.members_count} Mitglieder</span>
                    <span>{group.posts_count} Beiträge</span>
                  </div>

                  {/* Settings */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                        group.is_public
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {group.is_public ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {group.is_public ? 'Öffentlich' : 'Privat'}
                    </span>
                    {group.requires_approval && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Genehmigung erforderlich
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleGroupVerified(group.id, group.is_verified)}
                        className={`p-2 rounded-lg transition-colors ${
                          group.is_verified
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={group.is_verified ? 'Verifizierung entfernen' : 'Verifizieren'}
                        disabled={saving}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleGroupStatus(group.id, group.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          group.is_active
                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-red-600 bg-red-50'
                        }`}
                        title={group.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        disabled={saving}
                      >
                        {group.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Löschen"
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Neue Gruppe erstellen
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name (intern) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="feuerwehr-zernsdorf"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Anzeigename *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Freiwillige Feuerwehr Zernsdorf"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Beschreibung der Gruppe..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Farbe
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">Öffentlich</p>
                      <p className="text-sm text-slate-500">Gruppe ist für alle sichtbar</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">Offener Beitritt</p>
                      <p className="text-sm text-slate-500">Jeder kann beitreten</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_open}
                      onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900">Genehmigung erforderlich</p>
                      <p className="text-sm text-slate-500">Beitritt muss genehmigt werden</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.requires_approval}
                      onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kontakt-E-Mail
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="kontakt@beispiel.de"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://beispiel.de"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Erstellen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
