'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  UserX,
  BadgeCheck,
  Mail,
  Calendar,
  Clock,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason?: string;
  banned_at?: string;
  created_at: string;
  last_login_at?: string;
  login_count: number;
  user_roles?: Array<{
    roles: {
      name: string;
      display_name: string;
      color: string;
    };
  }>;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  color: string;
  priority: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [source, setSource] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      setUsers(data.users || []);
      setTotal(data.total || 0);
      setSource(data.source || '');
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Roles fetch error:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          is_banned: !selectedUser.is_banned,
          ban_reason: selectedUser.is_banned ? null : banReason,
          banned_at: selectedUser.is_banned ? null : new Date().toISOString(),
        })
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, is_banned: !u.is_banned, ban_reason: u.is_banned ? undefined : banReason }
          : u
      ));

      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason('');
    } catch (err) {
      console.error('Ban error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/de/admin" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users size={24} className="text-emerald-600" />
                Nutzerverwaltung
              </h1>
              <p className="text-sm text-slate-500">
                {total} Nutzer gesamt
                {source === 'demo' && ' (Demo-Daten)'}
              </p>
            </div>
          </div>
          <Link
            href="/de/admin/roles"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition flex items-center gap-2"
          >
            <Shield size={18} />
            Rollen verwalten
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Suche nach Name, E-Mail oder Username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="banned">Gesperrt</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Users size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Keine Nutzer gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nutzer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rolle</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Registriert</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Letzter Login</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const primaryRole = user.user_roles?.[0]?.roles;
                    const RoleIcon = primaryRole ? getRoleIcon(primaryRole.name) : User;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                              {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {user.display_name || user.username || 'Unbenannt'}
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Mail size={12} />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {primaryRole ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${primaryRole.color}20`,
                                color: primaryRole.color
                              }}
                            >
                              <RoleIcon size={12} />
                              {primaryRole.display_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <Ban size={12} />
                              Gesperrt
                            </span>
                          ) : user.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              <BadgeCheck size={12} />
                              Verifiziert
                            </span>
                          ) : user.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <User size={12} />
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                              <UserX size={12} />
                              Inaktiv
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            {formatDateTime(user.last_login_at)}
                          </div>
                          <span className="text-xs text-slate-400">
                            {user.login_count} Logins
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Rolle ändern"
                            >
                              <Shield size={18} />
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                              className={`p-2 rounded-lg transition ${
                                user.is_banned
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={user.is_banned ? 'Entsperren' : 'Sperren'}
                            >
                              <Ban size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                Seite {page} von {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {source === 'demo' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Demo-Modus:</strong> Die Nutzerverwaltung zeigt Beispieldaten.
              Führe die Migration <code className="bg-amber-100 px-1 rounded">005_menu_and_users.sql</code> aus,
              um echte Nutzerdaten zu verwenden.
            </p>
          </div>
        )}
      </main>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedUser.is_banned ? 'Nutzer entsperren' : 'Nutzer sperren'}
              </h3>
              <button onClick={() => setShowBanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-800">{selectedUser.display_name || selectedUser.email}</p>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>

            {!selectedUser.is_banned && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Grund für die Sperrung
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="z.B. Spam, unangemessene Inhalte..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            )}

            {selectedUser.is_banned && selectedUser.ban_reason && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Sperrgrund:</strong> {selectedUser.ban_reason}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleBanUser}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                  selectedUser.is_banned
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : selectedUser.is_banned ? (
                  <>Entsperren</>
                ) : (
                  <>
                    <Ban size={18} />
                    Sperren
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Rolle zuweisen</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-800">{selectedUser.display_name || selectedUser.email}</p>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-2 mb-6">
              {roles.map((role) => {
                const RoleIcon = getRoleIcon(role.name);
                const isCurrentRole = selectedUser.user_roles?.some(ur => ur.roles.name === role.name);

                return (
                  <button
                    key={role.id}
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition ${
                      isCurrentRole
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20`, color: role.color }}
                    >
                      <RoleIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{role.display_name}</p>
                      <p className="text-sm text-slate-500">Priorität: {role.priority}</p>
                    </div>
                    {isCurrentRole && (
                      <BadgeCheck className="text-emerald-500" size={20} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
