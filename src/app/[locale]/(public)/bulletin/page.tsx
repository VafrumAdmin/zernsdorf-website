'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Gift,
  Search,
  Repeat,
  Hand,
  Heart,
  LifeBuoy,
  AlertCircle,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  Plus,
  MapPin,
  Clock,
  Eye,
  Phone,
  Mail,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BulletinCategory {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
}

interface BulletinPost {
  id: string;
  category_id: string;
  author_name: string;
  title: string;
  content: string;
  is_lending: boolean;
  lending_duration?: string;
  location: string;
  images?: string[];
  is_resolved: boolean;
  valid_until?: string;
  views_count: number;
  created_at: string;
  category?: BulletinCategory;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  gift: Gift,
  search: Search,
  repeat: Repeat,
  hand: Hand,
  heart: Heart,
  'life-buoy': LifeBuoy,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  calendar: Calendar,
  'more-horizontal': MoreHorizontal,
};

export default function BulletinPage() {
  const t = useTranslations();
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    author_name: '',
    author_email: '',
    author_phone: '',
    title: '',
    content: '',
    is_lending: false,
    lending_duration: '',
    location: 'Zernsdorf',
    show_contact: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/bulletin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/bulletin?category=${selectedCategory}`
        : '/api/bulletin';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          category_id: '',
          author_name: '',
          author_email: '',
          author_phone: '',
          title: '',
          content: '',
          is_lending: false,
          lending_duration: '',
          location: 'Zernsdorf',
          show_contact: true,
        });
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MoreHorizontal;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Schwarzes Brett & Leih-Börse
          </h1>
          <p className="text-emerald-100 text-lg">
            Bieten, Suchen, Leihen - Nachbarschaftshilfe in Zernsdorf
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Alle
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.name
                      ? 'text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.name ? cat.color : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {cat.display_name}
                </button>
              );
            })}
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neuer Eintrag
          </Button>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Laden...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <MoreHorizontal className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Keine Einträge gefunden</h3>
            <p className="text-slate-500 mb-4">Sei der Erste und erstelle einen Eintrag!</p>
            <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Eintrag erstellen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const category = categories.find((c) => c.id === post.category_id);
              const Icon = category ? getCategoryIcon(category.icon) : MoreHorizontal;
              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow ${
                    post.is_resolved ? 'opacity-60' : ''
                  }`}
                >
                  {/* Category Badge */}
                  <div
                    className="px-4 py-2 flex items-center gap-2 text-white text-sm font-medium"
                    style={{ backgroundColor: category?.color || '#6B7280' }}
                  >
                    <Icon className="w-4 h-4" />
                    {category?.display_name || 'Sonstiges'}
                    {post.is_lending && (
                      <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
                        Leih-Börse
                      </span>
                    )}
                    {post.is_resolved && (
                      <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
                        Erledigt
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">{post.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4">{post.content}</p>

                    {post.is_lending && post.lending_duration && (
                      <div className="text-sm text-purple-600 mb-2">
                        <Repeat className="w-4 h-4 inline mr-1" />
                        Leihdauer: {post.lending_duration}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views_count}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-600">
                      von <span className="font-medium">{post.author_name}</span>
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
              <h2 className="text-xl font-semibold text-slate-800">Neuer Eintrag</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Bitte wählen...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Suche Bohrmaschine zum Ausleihen"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Beschreibe dein Anliegen genauer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_lending"
                  checked={formData.is_lending}
                  onChange={(e) => setFormData({ ...formData, is_lending: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_lending" className="text-sm text-slate-700">
                  Dies ist ein Leih-Angebot / Leih-Gesuch
                </label>
              </div>

              {formData.is_lending && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Leihdauer</label>
                  <input
                    type="text"
                    value={formData.lending_duration}
                    onChange={(e) => setFormData({ ...formData, lending_duration: e.target.value })}
                    placeholder="z.B. 1 Woche, Nach Absprache"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dein Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={formData.author_email}
                    onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={formData.author_phone}
                    onChange={(e) => setFormData({ ...formData, author_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_contact"
                  checked={formData.show_contact}
                  onChange={(e) => setFormData({ ...formData, show_contact: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="show_contact" className="text-sm text-slate-700">
                  Kontaktdaten öffentlich anzeigen
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
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Veröffentlichen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
