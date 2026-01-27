'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  UserX,
  BadgeCheck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  icon?: string;
  priority: number;
  is_system: boolean;
  is_active: boolean;
  role_permissions?: Array<{
    permissions: {
      name: string;
      display_name: string;
      category: string;
    };
  }>;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    description: '',
    color: '#6B7280',
    priority: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRoles(data.roles || []);
      setSource(data.source || '');
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin': return Shield;
      case 'moderator': return ShieldCheck;
      case 'editor': return ShieldAlert;
      case 'verified': return BadgeCheck;
      case 'guest': return UserX;
      default: return User;
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditForm({
      display_name: role.display_name,
      description: role.description || '',
      color: role.color,
      priority: role.priority,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRole.id,
          ...editForm,
        }),
      });

      if (res.ok) {
        setRoles(prev => prev.map(r =>
          r.id === selectedRole.id ? { ...r, ...editForm } : r
        ));
        setShowEditModal(false);
        setSelectedRole(null);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const permissionCategories = [
    { key: 'admin', label: 'Administration' },
    { key: 'users', label: 'Nutzerverwaltung' },
    { key: 'content', label: 'Inhalte' },
    { key: 'forum', label: 'Forum' },
    { key: 'bulletin', label: 'Schwarzes Brett' },
    { key: 'events', label: 'Veranstaltungen' },
    { key: 'businesses', label: 'Verzeichnis' },
    { key: 'reports', label: 'Meldungen' },
    { key: 'traffic', label: 'Verkehr' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/de/admin/users" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield size={24} className="text-emerald-600" />
                Rollenverwaltung
              </h1>
              <p className="text-sm text-slate-500">
                {roles.length} Rollen definiert
                {source === 'fallback' && ' (Demo-Daten)'}
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
            disabled={source === 'fallback'}
          >
            <Plus size={18} />
            Neue Rolle
          </button>
        </div>
      </header>

      {/* Roles Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const RoleIcon = getRoleIcon(role.name);

            return (
              <div
                key={role.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20`, color: role.color }}
                    >
                      <RoleIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{role.display_name}</h3>
                      <p className="text-sm text-slate-500">@{role.name}</p>
                    </div>
                  </div>
                  {role.is_system && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                      System
                    </span>
                  )}
                </div>

                {role.description && (
                  <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    Priorität: {role.priority}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Bearbeiten"
                    >
                      <Edit size={18} />
                    </button>
                    {!role.is_system && (
                      <button
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Permissions Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-800">Berechtigungsübersicht</h2>
            <p className="text-sm text-slate-500">Welche Rolle hat welche Berechtigungen</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 min-w-[200px]">Berechtigung</th>
                  {roles.slice(0, 5).map((role) => (
                    <th
                      key={role.id}
                      className="text-center px-3 py-3 font-medium"
                      style={{ color: role.color }}
                    >
                      {role.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionCategories.map((cat) => (
                  <tr key={cat.key} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{cat.label}</td>
                    {roles.slice(0, 5).map((role) => {
                      // Demo: Admins have all, others have some
                      const hasPermission = role.name === 'admin' ||
                        (role.name === 'moderator' && ['content', 'forum', 'bulletin', 'reports'].includes(cat.key)) ||
                        (role.name === 'editor' && ['content', 'events', 'businesses'].includes(cat.key)) ||
                        (['verified', 'member'].includes(role.name) && ['forum', 'bulletin', 'events'].includes(cat.key));

                      return (
                        <td key={role.id} className="text-center px-3 py-3">
                          {hasPermission ? (
                            <Check className="mx-auto text-emerald-500" size={18} />
                          ) : (
                            <X className="mx-auto text-slate-300" size={18} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {source === 'fallback' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Demo-Modus:</strong> Die Rollenverwaltung zeigt Beispieldaten.
              Führe die Migration <code className="bg-amber-100 px-1 rounded">005_menu_and_users.sql</code> aus,
              um echte Rollen zu verwenden.
            </p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Rolle bearbeiten</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anzeigename
                </label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Farbe
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priorität
                  </label>
                  <input
                    type="number"
                    value={editForm.priority}
                    onChange={(e) => setEditForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || source === 'fallback'}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
