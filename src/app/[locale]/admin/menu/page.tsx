'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Menu,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Home,
  MessageSquare,
  ClipboardList,
  PawPrint,
  ShieldCheck,
  Trash2,
  Star,
  Calendar,
  MapPin,
  Car,
  History,
} from 'lucide-react';

interface MenuItem {
  id: string;
  key: string;
  name: string;
  name_en?: string;
  icon: string;
  path: string;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  requires_auth?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'home': Home,
  'message-square': MessageSquare,
  'clipboard-list': ClipboardList,
  'paw-print': PawPrint,
  'shield-check': ShieldCheck,
  'trash-2': Trash2,
  'star': Star,
  'calendar': Calendar,
  'map-pin': MapPin,
  'car': Car,
  'history': History,
};

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      setMenuItems(data.menuItems || []);
      setSource(data.source || '');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Fehler beim Laden der Menüpunkte');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    setSaving(item.id);
    setError(null);

    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active
        })
      });

      if (!res.ok) {
        throw new Error('Update fehlgeschlagen');
      }

      setMenuItems(prev => prev.map(m =>
        m.id === item.id ? { ...m, is_active: !m.is_active } : m
      ));

      setSaved(item.id);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      console.error('Toggle error:', err);
      setError('Fehler beim Aktualisieren');
    } finally {
      setSaving(null);
    }
  };

  const IconComponent = ({ iconName, ...props }: { iconName: string; size?: number; className?: string }) => {
    const Icon = iconMap[iconName] || Menu;
    return <Icon {...props} />;
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/de/admin" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Menüverwaltung</h1>
              <p className="text-sm text-slate-500">Menüpunkte aktivieren oder deaktivieren</p>
            </div>
          </div>
          {source === 'fallback' && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
              Demo-Modus
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Hier kannst du einzelne Menüpunkte für die öffentliche Website aktivieren oder deaktivieren.
              Deaktivierte Menüpunkte sind für Besucher nicht sichtbar.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center justify-between hover:bg-slate-50 transition ${
                  !item.is_active ? 'bg-slate-50 opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-300 cursor-move">
                    <GripVertical size={20} />
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <IconComponent iconName={item.icon} size={20} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${item.is_active ? 'text-slate-800' : 'text-slate-500'}`}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-400">{item.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {saving === item.id && (
                    <Loader2 className="animate-spin text-emerald-500" size={20} />
                  )}
                  {saved === item.id && (
                    <Check className="text-emerald-500" size={20} />
                  )}

                  <button
                    onClick={() => toggleActive(item)}
                    disabled={saving === item.id || source === 'fallback'}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      item.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                    } ${source === 'fallback' ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        item.is_active ? 'left-7' : 'left-1'
                      }`}
                    >
                      {item.is_active ? (
                        <Eye size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
                      ) : (
                        <EyeOff size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {source === 'fallback' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Hinweis:</strong> Die Datenbank-Tabellen für die Menüverwaltung wurden noch nicht erstellt.
              Führe die Migration <code className="bg-amber-100 px-1 rounded">005_menu_and_users.sql</code> im
              Supabase Dashboard aus, um diese Funktion zu aktivieren.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
