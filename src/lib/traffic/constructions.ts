import { createClient } from '@/lib/supabase/server';
import type { Construction, DBConstruction, dbToConstruction } from '@/types';

/**
 * Holt aktive Baustellen aus der Datenbank
 */
export async function getActiveConstructions(): Promise<Construction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .eq('status', 'active')
    .eq('is_visible', true)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching active constructions:', error);
    return [];
  }

  return (data || []).map(dbToConstructionLocal);
}

/**
 * Holt geplante Baustellen aus der Datenbank
 */
export async function getPlannedConstructions(): Promise<Construction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .eq('status', 'planned')
    .eq('is_visible', true)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching planned constructions:', error);
    return [];
  }

  return (data || []).map(dbToConstructionLocal);
}

/**
 * Holt alle sichtbaren Baustellen (aktiv + geplant)
 */
export async function getAllConstructions(): Promise<Construction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .eq('is_visible', true)
    .in('status', ['active', 'planned'])
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching constructions:', error);
    return [];
  }

  return (data || []).map(dbToConstructionLocal);
}

/**
 * Holt Baustellen nach Kategorie
 */
export async function getConstructionsByCategory(category: string): Promise<Construction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .eq('category', category)
    .eq('is_visible', true)
    .in('status', ['active', 'planned'])
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching constructions by category:', error);
    return [];
  }

  return (data || []).map(dbToConstructionLocal);
}

/**
 * Konvertiert DB-Format zu Frontend-Format
 */
function dbToConstructionLocal(db: DBConstruction): Construction {
  return {
    id: db.id,
    title: db.title,
    description: db.description || '',
    location: db.location,
    startDate: new Date(db.start_date),
    endDate: db.end_date ? new Date(db.end_date) : undefined,
    status: db.status,
    source: db.source || '',
    sourceUrl: db.source_url || undefined,
    type: db.type,
    category: db.category || undefined,
    impactLevel: db.impact_level,
    trafficImpact: db.traffic_impact || undefined,
    detourInfo: db.detour_info || undefined,
    isFeatured: db.is_featured,
    coordinates: db.latitude && db.longitude
      ? { lat: db.latitude, lng: db.longitude }
      : undefined,
  };
}

// Re-export DBConstruction type for API routes
export type { DBConstruction };
