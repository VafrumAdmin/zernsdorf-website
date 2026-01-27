import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import {
  User,
  Settings,
  MessageSquare,
  ShoppingBag,
  Bell,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mein Bereich',
  description: 'Ihr persönlicher Bereich auf ZernsdorfConnect',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name, display_name, color)')
    .eq('user_id', user?.id);

  // Get unread notifications count
  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('is_read', false);

  // Calculate member duration
  const memberSince = profile?.created_at ? new Date(profile.created_at) : new Date();
  const daysSinceMember = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));

  const displayName = profile?.nickname || profile?.first_name || profile?.username || 'Nutzer';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Willkommen, {displayName}!
          </h1>
          <p className="text-slate-600 mt-1">
            Hier finden Sie eine Übersicht über Ihre Aktivitäten und Einstellungen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{profile?.posts_count || 0}</p>
                    <p className="text-xs text-slate-500">Beiträge</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{profile?.listings_count || 0}</p>
                    <p className="text-xs text-slate-500">Anzeigen</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{profile?.reputation_points || 0}</p>
                    <p className="text-xs text-slate-500">Punkte</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{daysSinceMember}</p>
                    <p className="text-xs text-slate-500">Tage dabei</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Schnellzugriff</h2>
              </div>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/forum"
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Forum</p>
                      <p className="text-sm text-slate-500">Diskutieren Sie mit der Community</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>

                <Link
                  href="/listings"
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Kleinanzeigen</p>
                      <p className="text-sm text-slate-500">Kaufen, verkaufen, tauschen</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>

                <Link
                  href="/events"
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Veranstaltungen</p>
                      <p className="text-sm text-slate-500">Lokale Events entdecken</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Letzte Aktivitäten</h2>
              </div>
              <div className="p-6 text-center text-slate-500">
                <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>Noch keine Aktivitäten vorhanden.</p>
                <p className="text-sm">Starten Sie im Forum oder erstellen Sie eine Anzeige!</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <h3 className="font-semibold text-slate-900">{displayName}</h3>
                <p className="text-sm text-slate-500">@{profile?.username}</p>

                {/* Roles */}
                {userRoles && userRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {userRoles.map((ur: unknown, index: number) => {
                      const userRole = ur as { role: { name: string; display_name: string; color: string } | null };
                      return userRole.role && (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${userRole.role.color}20`,
                            color: userRole.role.color,
                          }}
                        >
                          {userRole.role.display_name}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Link
                    href="/profile"
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Profil bearbeiten
                  </Link>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Benachrichtigungen</h2>
                {unreadNotifications && unreadNotifications > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                    {unreadNotifications} neu
                  </span>
                )}
              </div>
              <div className="p-6 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">Keine neuen Benachrichtigungen</p>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Einstellungen</h2>
              </div>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Kontoeinstellungen</span>
                </Link>
                <Link
                  href="/settings/privacy"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Privatsphäre</span>
                </Link>
                <Link
                  href="/settings/notifications"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Benachrichtigungen</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
