import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import {
  MessageCircle,
  Plus,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  Pin,
} from 'lucide-react';
import type { ForumCategory, ForumThreadWithAuthor } from '@/types/database';

export const metadata: Metadata = {
  title: 'Forum',
  description: 'Das Community-Forum von ZernsdorfConnect - Diskutieren Sie mit Nachbarn',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ForumPage() {
  const supabase = await createClient();

  // Get categories with thread/post counts
  const { data: categories } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order');

  // Get recent threads
  const { data: recentThreads } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:profiles!author_id(username, nickname, avatar_url),
      category:forum_categories!category_id(name, slug)
    `)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get pinned threads
  const { data: pinnedThreads } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:profiles!author_id(username, nickname, avatar_url),
      category:forum_categories!category_id(name, slug)
    `)
    .eq('is_pinned', true)
    .eq('is_hidden', false)
    .limit(3);

  // Get user for "New Thread" button
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Forum</h1>
            <p className="text-slate-600 mt-1">
              Diskutieren Sie mit der Zernsdorf-Community
            </p>
          </div>
          {user && (
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Neuer Beitrag
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pinned Threads */}
            {pinnedThreads && pinnedThreads.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h2 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4" />
                  Angepinnt
                </h2>
                <div className="space-y-2">
                  {pinnedThreads.map((thread: ForumThreadWithAuthor & { author: { username: string; nickname: string | null }; category: { name: string; slug: string } }) => (
                    <Link
                      key={thread.id}
                      href={`/forum/thread/${thread.id}`}
                      className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{thread.title}</h3>
                          <p className="text-sm text-slate-500">
                            in {thread.category?.name}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {thread.replies_count} Antworten
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Kategorien</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {categories && categories.length > 0 ? (
                  categories.map((category: ForumCategory) => (
                    <Link
                      key={category.id}
                      href={`/forum/${category.slug}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <MessageCircle
                            className="w-6 h-6"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-slate-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="text-center">
                          <p className="font-semibold text-slate-900">{category.threads_count}</p>
                          <p className="text-xs">Themen</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-slate-900">{category.posts_count}</p>
                          <p className="text-xs">Beiträge</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Noch keine Kategorien vorhanden.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Threads */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Neueste Beiträge
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {recentThreads && recentThreads.length > 0 ? (
                  recentThreads.map((thread: ForumThreadWithAuthor & { author: { username: string; nickname: string | null; avatar_url: string | null }; category: { name: string; slug: string } }) => (
                    <Link
                      key={thread.id}
                      href={`/forum/thread/${thread.id}`}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center">
                        {thread.author?.avatar_url ? (
                          <img
                            src={thread.author.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {thread.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          von {thread.author?.nickname || thread.author?.username} in{' '}
                          <span className="text-emerald-600">{thread.category?.name}</span>
                        </p>
                      </div>
                      <div className="text-right text-sm flex-shrink-0">
                        <p className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(thread.created_at).toLocaleDateString('de-DE')}
                        </p>
                        <p className="text-slate-500">{thread.replies_count} Antworten</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Noch keine Beiträge vorhanden.</p>
                    {user && (
                      <Link
                        href="/forum/new"
                        className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Ersten Beitrag erstellen
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Forum Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Forum-Statistik</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Kategorien</span>
                  <span className="font-semibold text-slate-900">
                    {categories?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Themen</span>
                  <span className="font-semibold text-slate-900">
                    {categories?.reduce((sum: number, c: ForumCategory) => sum + c.threads_count, 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Beiträge</span>
                  <span className="font-semibold text-slate-900">
                    {categories?.reduce((sum: number, c: ForumCategory) => sum + c.posts_count, 0) || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Forum-Regeln</h2>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  Respektvoller Umgang miteinander
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  Keine Beleidigungen oder Diskriminierung
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  Bleiben Sie beim Thema
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  Keine Werbung ohne Genehmigung
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  Persönliche Daten schützen
                </li>
              </ul>
            </div>

            {/* CTA for non-logged in users */}
            {!user && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-emerald-900 mb-2">
                  Werden Sie Teil der Community!
                </h3>
                <p className="text-sm text-emerald-700 mb-4">
                  Registrieren Sie sich kostenlos, um an Diskussionen teilzunehmen.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Registrieren
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium rounded-lg transition-colors"
                  >
                    Anmelden
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
