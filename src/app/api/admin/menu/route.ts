import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Liste aller Menüpunkte
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      // Fallback wenn Tabelle nicht existiert
      if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
        return NextResponse.json({
          menuItems: getDefaultMenuItems(),
          source: 'fallback'
        });
      }
      throw error;
    }

    return NextResponse.json({
      menuItems: menuItems || getDefaultMenuItems(),
      source: menuItems?.length ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json({
      menuItems: getDefaultMenuItems(),
      source: 'fallback'
    });
  }
}

// PATCH - Menüpunkt aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ menuItem: data });
  } catch (error) {
    console.error('Menu update error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' },
      { status: 500 }
    );
  }
}

function getDefaultMenuItems() {
  return [
    { id: '1', key: 'home', name: 'Startseite', name_en: 'Home', icon: 'home', path: '/', sort_order: 1, is_active: true, is_public: true },
    { id: '2', key: 'forum', name: 'Forum', name_en: 'Forum', icon: 'message-square', path: '/forum', sort_order: 10, is_active: true, is_public: true },
    { id: '3', key: 'bulletin', name: 'Schwarzes Brett', name_en: 'Bulletin Board', icon: 'clipboard-list', path: '/bulletin', sort_order: 20, is_active: true, is_public: true },
    { id: '4', key: 'pets', name: 'Haustier-SOS', name_en: 'Pet SOS', icon: 'paw-print', path: '/pets', sort_order: 30, is_active: true, is_public: true },
    { id: '5', key: 'factcheck', name: 'Faktencheck', name_en: 'Fact Check', icon: 'shield-check', path: '/factcheck', sort_order: 40, is_active: true, is_public: true },
    { id: '6', key: 'report', name: 'Mängelmelder', name_en: 'Issue Reporter', icon: 'trash-2', path: '/report', sort_order: 50, is_active: true, is_public: true },
    { id: '7', key: 'listings', name: 'Marktplatz', name_en: 'Marketplace', icon: 'star', path: '/listings', sort_order: 60, is_active: true, is_public: true },
    { id: '8', key: 'events', name: 'Veranstaltungen', name_en: 'Events', icon: 'calendar', path: '/events', sort_order: 70, is_active: true, is_public: true },
    { id: '9', key: 'directory', name: 'Verzeichnis', name_en: 'Directory', icon: 'map-pin', path: '/directory', sort_order: 80, is_active: true, is_public: true },
    { id: '10', key: 'traffic', name: 'Verkehr', name_en: 'Traffic', icon: 'car', path: '/traffic', sort_order: 90, is_active: true, is_public: true },
    { id: '11', key: 'waste', name: 'Abfallkalender', name_en: 'Waste Calendar', icon: 'calendar', path: '/waste', sort_order: 100, is_active: true, is_public: true },
    { id: '12', key: 'history', name: 'Geschichte', name_en: 'History', icon: 'history', path: '/history', sort_order: 110, is_active: true, is_public: true },
  ];
}
