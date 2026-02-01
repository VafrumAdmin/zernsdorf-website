import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// Deterministische Shuffle-Funktion basierend auf Seed (Datum)
// Sorgt dafür, dass die Reihenfolge jeden Tag wechselt, aber innerhalb eines Tages konsistent bleibt
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];

  // Einfacher Pseudo-Zufallsgenerator (Mulberry32)
  const mulberry32 = (s: number) => {
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const random = mulberry32(seed);

  // Fisher-Yates Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// Generiert einen Seed basierend auf 2-Stunden-Intervallen
function getRotationSeed(): number {
  const now = new Date();
  // 2-Stunden-Slot berechnen (0-11 pro Tag)
  const twoHourSlot = Math.floor(now.getHours() / 2);
  const dateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${twoHourSlot}`;

  // Einfache Hash-Funktion für String zu Zahl
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// GET: Öffentliche API für Businesses (nur aktive Einträge)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Filter-Parameter
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!isSupabaseConfigured()) {
    // Keine Datenbank konfiguriert - leeres Array zurückgeben
    return NextResponse.json({
      businesses: [],
      total: 0,
      source: 'none'
    });
  }

  const supabase = await createClient();

  try {
    // Erst Kategorien laden
    const { data: categories } = await supabase
      .from('business_categories')
      .select('id, name, display_name, icon, color');

    type Category = { id: string; name: string; display_name: string; icon: string; color: string };
    const categoryMap = new Map<string, Category>();
    (categories || []).forEach((c: Category) => categoryMap.set(c.id, c));

    // Dann Businesses ohne JOIN (Schema-Cache-Probleme)
    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Filter anwenden
    if (category) {
      query = query.eq('category_id', category);
    }
    if (location) {
      query = query.eq('location', location);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Keine Sortierung in der DB - wir shufflen auf Server-Seite für faire Rotation
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform mit Kategorie-Daten
    const transformed = (data || []).map((b: Record<string, unknown>) => {
      const cat = categoryMap.get(b.category_id as string);
      return {
        ...b,
        category_name: cat?.name || null,
        category_display_name: cat?.display_name || null,
        category_icon: cat?.icon || null,
        category_color: cat?.color || null,
      };
    });

    // Tägliche Rotation: Featured/Recommended oben, Rest wird täglich neu gemischt
    const featured = transformed.filter((b: Record<string, unknown>) => b.is_featured || b.is_recommended);
    const regular = transformed.filter((b: Record<string, unknown>) => !b.is_featured && !b.is_recommended);

    // Shuffle basierend auf 2-Stunden-Intervall
    const rotationSeed = getRotationSeed();
    const shuffledRegular = seededShuffle(regular, rotationSeed);

    // Featured zuerst (auch geshuffled), dann der Rest
    const shuffledFeatured = seededShuffle(featured, rotationSeed);
    const sortedBusinesses = [...shuffledFeatured, ...shuffledRegular];

    // Pagination anwenden
    const paginatedBusinesses = sortedBusinesses.slice(offset, offset + limit);

    return NextResponse.json({
      businesses: paginatedBusinesses,
      total: count || 0,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
