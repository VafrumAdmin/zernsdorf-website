import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import {
  ShoppingBag,
  Plus,
  Search,
  Tag,
  Gift,
  Repeat,
  MapPin,
  Clock,
  Heart,
  Eye,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { ListingCategory, ListingWithAuthor } from '@/types/database';

export const metadata: Metadata = {
  title: 'Kleinanzeigen',
  description: 'Lokaler Marktplatz für Zernsdorf - Kaufen, Verkaufen, Tauschen',
};

export const dynamic = 'force-dynamic';

const listingTypeIcons = {
  offer: Tag,
  search: Search,
  gift: Gift,
  swap: Repeat,
};

const listingTypeLabels = {
  offer: 'Biete',
  search: 'Suche',
  gift: 'Verschenke',
  swap: 'Tausche',
};

const listingTypeColors = {
  offer: 'bg-emerald-100 text-emerald-700',
  search: 'bg-blue-100 text-blue-700',
  gift: 'bg-purple-100 text-purple-700',
  swap: 'bg-amber-100 text-amber-700',
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get categories
  const { data: categories } = await supabase
    .from('listing_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  // Build query for listings
  let query = supabase
    .from('listings')
    .select(`
      *,
      author:profiles!author_id(username, nickname, avatar_url),
      category:listing_categories!category_id(name, slug, icon, color)
    `)
    .eq('status', 'active')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.type) {
    query = query.eq('listing_type', params.type);
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from('listing_categories')
      .select('id')
      .eq('slug', params.category)
      .single();

    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  const { data: listings } = await query.limit(20);

  // Get user
  const { data: { user } } = await supabase.auth.getUser();

  const formatPrice = (listing: ListingWithAuthor & { price: number | null; price_type: string }) => {
    if (listing.price_type === 'free') return 'Kostenlos';
    if (listing.price_type === 'swap') return 'Tausch';
    if (listing.price_type === 'negotiable' && listing.price) {
      return `${listing.price.toLocaleString('de-DE')} € VB`;
    }
    if (listing.price) {
      return `${listing.price.toLocaleString('de-DE')} €`;
    }
    return 'Preis auf Anfrage';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kleinanzeigen</h1>
            <p className="text-slate-600 mt-1">
              Lokaler Marktplatz für Zernsdorf
            </p>
          </div>
          {user && (
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Anzeige aufgeben
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Was suchen Sie?"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <select
              name="type"
              defaultValue={params.type}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Alle Typen</option>
              <option value="offer">Biete</option>
              <option value="search">Suche</option>
              <option value="gift">Verschenke</option>
              <option value="swap">Tausche</option>
            </select>

            <select
              name="category"
              defaultValue={params.category}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Alle Kategorien</option>
              {categories?.map((cat: ListingCategory) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtern
            </button>
          </form>
        </div>

        {/* Type Quick Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link
            href="/listings"
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !params.type ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Alle
          </Link>
          {Object.entries(listingTypeLabels).map(([type, label]) => {
            const Icon = listingTypeIcons[type as keyof typeof listingTypeIcons];
            return (
              <Link
                key={type}
                href={`/listings?type=${type}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  params.type === type ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.map((listing: ListingWithAuthor & { author: { username: string; nickname: string | null; avatar_url: string | null }; category: { name: string; slug: string; icon: string; color: string } }) => {
                  const TypeIcon = listingTypeIcons[listing.listing_type as keyof typeof listingTypeIcons];
                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Image */}
                      <div className="aspect-[4/3] bg-slate-100 relative">
                        {listing.thumbnail_url || (listing.images && listing.images[0]) ? (
                          <img
                            src={listing.thumbnail_url || listing.images![0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-slate-300" />
                          </div>
                        )}

                        {/* Type Badge */}
                        <span
                          className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            listingTypeColors[listing.listing_type as keyof typeof listingTypeColors]
                          }`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {listingTypeLabels[listing.listing_type as keyof typeof listingTypeLabels]}
                        </span>

                        {/* Favorite Button */}
                        <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                          {listing.title}
                        </h3>

                        <p className="text-lg font-bold text-emerald-600 mb-2">
                          {formatPrice(listing)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(listing.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            {listing.category?.name}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views_count}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Keine Anzeigen gefunden
                </h3>
                <p className="text-slate-600 mb-6">
                  {params.q || params.type || params.category
                    ? 'Versuchen Sie andere Suchkriterien.'
                    : 'Seien Sie der Erste, der eine Anzeige aufgibt!'}
                </p>
                {user && (
                  <Link
                    href="/listings/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Anzeige aufgeben
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Kategorien</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {categories?.map((category: ListingCategory) => (
                  <Link
                    key={category.id}
                    href={`/listings?category=${category.slug}`}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${
                      params.category === category.slug ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <span className="text-sm text-slate-700">{category.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Tipps für gute Anzeigen</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Aussagekräftiger Titel</li>
                <li>• Gute Fotos hochladen</li>
                <li>• Genaue Beschreibung</li>
                <li>• Fairer Preis angeben</li>
              </ul>
            </div>

            {/* CTA */}
            {!user && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-emerald-900 mb-2">
                  Jetzt mitmachen!
                </h3>
                <p className="text-sm text-emerald-700 mb-4">
                  Registrieren Sie sich, um Anzeigen aufzugeben.
                </p>
                <Link
                  href="/auth/register"
                  className="block w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
