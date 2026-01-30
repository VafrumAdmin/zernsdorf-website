// Waste Collection Types
export type WasteType = 'restmuell' | 'papier' | 'gelbesack' | 'bio' | 'laubsaecke';

export interface WasteCollection {
  id: string;
  date: Date;
  type: WasteType;
  street?: string;
}

export interface WasteSettings {
  street: string;
  houseNumber: string;
  enabledTypes: WasteType[];
  notifications: boolean;
  // Persönliche SBAZV ICS-URL für diese Adresse
  icsUrl?: string;
}

// Traffic/Construction Types
export type ConstructionType = 'road' | 'highway' | 'rail' | 'bridge' | 'utility' | 'other';
export type ConstructionStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type ConstructionImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Construction {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  status: ConstructionStatus;
  source: string;
  sourceUrl?: string;
  type?: ConstructionType;
  category?: string;
  impactLevel?: ConstructionImpactLevel;
  trafficImpact?: string;
  detourInfo?: string;
  isFeatured?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// DB Construction (snake_case) - für API-Responses
export interface DBConstruction {
  id: string;
  title: string;
  description: string | null;
  location: string;
  type: ConstructionType;
  category: string | null;
  start_date: string;
  end_date: string | null;
  status: ConstructionStatus;
  impact_level: ConstructionImpactLevel;
  traffic_impact: string | null;
  detour_info: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  source_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Konverter von DB zu Frontend
export function dbToConstruction(db: DBConstruction): Construction {
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
    coordinates: db.latitude && db.longitude ? { lat: db.latitude, lng: db.longitude } : undefined,
  };
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  category: EventCategory;
  imageUrl?: string;
  organizer?: string;
  url?: string;
}

export type EventCategory =
  | 'festival'
  | 'market'
  | 'culture'
  | 'sports'
  | 'community'
  | 'politics'
  | 'other';

// History Types
export interface HistoryEntry {
  id: string;
  year: number;
  title: string;
  description: string;
  imageUrl?: string;
  category: 'founding' | 'development' | 'war' | 'modern' | 'culture';
}

// User Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface UserSettings {
  userId?: string;
  wasteSettings?: WasteSettings;
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
}

// Local Storage Settings (for non-account users)
export interface LocalSettings {
  wasteSettings?: WasteSettings;
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
