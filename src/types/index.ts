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
export interface Construction {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'active' | 'completed';
  source: string;
  coordinates?: {
    lat: number;
    lng: number;
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
