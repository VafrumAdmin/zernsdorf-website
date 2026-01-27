'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { ZERNSDORF_STOPS } from '@/lib/transit';

// =====================================================
// TYPES
// =====================================================

export interface UserAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

export interface NearestStop {
  id: string;
  name: string;
  vbbId: string;
  distance?: number;
}

export interface UserPreferences {
  // Adresse
  address: UserAddress | null;

  // ÖPNV
  nearestStop: NearestStop | null;
  favoriteStops: NearestStop[];

  // Müllabfuhr
  wasteStreetId: string | null;
  wasteStreetName: string | null;
  wasteNotifications: boolean;
  wasteNotificationTime: string; // z.B. "18:00"

  // Arbeitsplatz (für Pendler)
  workAddress: UserAddress | null;
  workArrivalTime: string | null; // z.B. "08:30"

  // Allgemeine Einstellungen
  storeDataLocally: boolean; // Präferenz: lokal oder in DB speichern
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
}

export interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoaded: boolean;
  isLoggedIn: boolean;
  isSyncing: boolean;

  // Adresse
  setAddress: (address: UserAddress | null) => Promise<void>;

  // ÖPNV
  setNearestStop: (stop: NearestStop | null) => Promise<void>;
  addFavoriteStop: (stop: NearestStop) => Promise<void>;
  removeFavoriteStop: (stopId: string) => Promise<void>;

  // Müllabfuhr
  setWasteStreet: (streetId: string | null, streetName: string | null) => Promise<void>;
  setWasteNotifications: (enabled: boolean, time?: string) => Promise<void>;

  // Arbeitsplatz
  setWorkAddress: (address: UserAddress | null) => Promise<void>;
  setWorkArrivalTime: (time: string | null) => Promise<void>;

  // Allgemein
  setStoreDataLocally: (local: boolean) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setLanguage: (lang: 'de' | 'en') => Promise<void>;

  // Sync
  syncFromDatabase: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  clearLocalData: () => void;
}

// =====================================================
// DEFAULT VALUES
// =====================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  address: null,
  nearestStop: null,
  favoriteStops: [],
  wasteStreetId: null,
  wasteStreetName: null,
  wasteNotifications: false,
  wasteNotificationTime: '18:00',
  workAddress: null,
  workArrivalTime: null,
  storeDataLocally: true,
  theme: 'system',
  language: 'de',
};

const LOCAL_STORAGE_KEY = 'zernsdorf_user_preferences';

// =====================================================
// CONTEXT
// =====================================================

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isLoggedIn = !!user;

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
    }

    setIsLoaded(true);
  }, []);

  // Sync from auth profile when user logs in - this is the main source of truth
  useEffect(() => {
    if (authLoading || !isLoaded) return;

    if (isLoggedIn && profile) {
      // Map profile data to preferences
      const profilePrefs = mapProfileToPreferences(profile);
      setPreferences(prev => ({ ...prev, ...profilePrefs }));
      saveToLocalStorage({ ...preferences, ...profilePrefs });
    }
  }, [isLoggedIn, authLoading, isLoaded, profile]);

  // Save to localStorage whenever preferences change
  const saveToLocalStorage = useCallback((prefs: UserPreferences) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }, []);

  // Sync from database
  const syncFromDatabase = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          const dbPrefs = mapDatabaseToPreferences(data.preferences);
          setPreferences(dbPrefs);
          saveToLocalStorage(dbPrefs);
        }
      }
    } catch (error) {
      console.error('Error syncing preferences from database:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, saveToLocalStorage]);

  // Sync to database
  const syncToDatabase = useCallback(async () => {
    if (!isLoggedIn || preferences.storeDataLocally) return;

    setIsSyncing(true);
    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapPreferencesToDatabase(preferences)),
      });
    } catch (error) {
      console.error('Error syncing preferences to database:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, preferences]);

  // Update preferences helper
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    saveToLocalStorage(newPrefs);

    // Sync to database if logged in and not storing locally
    if (isLoggedIn && !newPrefs.storeDataLocally) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mapPreferencesToDatabase(newPrefs)),
        });
      } catch (error) {
        console.error('Error syncing to database:', error);
      }
    }
  }, [preferences, isLoggedIn, saveToLocalStorage]);

  // Address
  const setAddress = useCallback(async (address: UserAddress | null) => {
    await updatePreferences({ address });
  }, [updatePreferences]);

  // ÖPNV - also syncs to profile if logged in
  const setNearestStop = useCallback(async (stop: NearestStop | null) => {
    await updatePreferences({ nearestStop: stop });

    // Also update profile database if logged in
    if (isLoggedIn && stop) {
      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            favorite_bus_stops: [stop.vbbId],
          }),
        });
      } catch (error) {
        console.error('Error syncing stop to profile:', error);
      }
    }
  }, [updatePreferences, isLoggedIn]);

  const addFavoriteStop = useCallback(async (stop: NearestStop) => {
    const exists = preferences.favoriteStops.some(s => s.id === stop.id);
    if (!exists) {
      await updatePreferences({
        favoriteStops: [...preferences.favoriteStops, stop],
      });
    }
  }, [preferences.favoriteStops, updatePreferences]);

  const removeFavoriteStop = useCallback(async (stopId: string) => {
    await updatePreferences({
      favoriteStops: preferences.favoriteStops.filter(s => s.id !== stopId),
    });
  }, [preferences.favoriteStops, updatePreferences]);

  // Müllabfuhr
  const setWasteStreet = useCallback(async (streetId: string | null, streetName: string | null) => {
    await updatePreferences({ wasteStreetId: streetId, wasteStreetName: streetName });
  }, [updatePreferences]);

  const setWasteNotifications = useCallback(async (enabled: boolean, time?: string) => {
    const updates: Partial<UserPreferences> = { wasteNotifications: enabled };
    if (time) updates.wasteNotificationTime = time;
    await updatePreferences(updates);
  }, [updatePreferences]);

  // Arbeitsplatz
  const setWorkAddress = useCallback(async (address: UserAddress | null) => {
    await updatePreferences({ workAddress: address });
  }, [updatePreferences]);

  const setWorkArrivalTime = useCallback(async (time: string | null) => {
    await updatePreferences({ workArrivalTime: time });
  }, [updatePreferences]);

  // Allgemein
  const setStoreDataLocally = useCallback(async (local: boolean) => {
    await updatePreferences({ storeDataLocally: local });

    // If switching to database storage and logged in, sync immediately
    if (!local && isLoggedIn) {
      await syncToDatabase();
    }
  }, [updatePreferences, isLoggedIn, syncToDatabase]);

  const setTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  }, [updatePreferences]);

  const setLanguage = useCallback(async (lang: 'de' | 'en') => {
    await updatePreferences({ language: lang });
  }, [updatePreferences]);

  // Clear local data
  const clearLocalData = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value: UserPreferencesContextType = {
    preferences,
    isLoaded,
    isLoggedIn,
    isSyncing,
    setAddress,
    setNearestStop,
    addFavoriteStop,
    removeFavoriteStop,
    setWasteStreet,
    setWasteNotifications,
    setWorkAddress,
    setWorkArrivalTime,
    setStoreDataLocally,
    setTheme,
    setLanguage,
    syncFromDatabase,
    syncToDatabase,
    clearLocalData,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}

// =====================================================
// MAPPING HELPERS
// =====================================================

/**
 * Maps the auth profile (from useAuth) to UserPreferences
 * This is the main sync - profile is the source of truth for logged in users
 */
function mapProfileToPreferences(profile: Record<string, unknown> | object): Partial<UserPreferences> {
  const data = profile as Record<string, unknown>;
  const prefs: Partial<UserPreferences> = {};

  // Address from profile
  if (data.street) {
    prefs.address = {
      street: (data.street as string) || '',
      houseNumber: (data.house_number as string) || '',
      postalCode: (data.postal_code as string) || '',
      city: (data.city as string) || 'Zernsdorf',
    };
  }

  // Work address from profile
  if (data.work_street) {
    prefs.workAddress = {
      street: (data.work_street as string) || '',
      houseNumber: (data.work_house_number as string) || '',
      postalCode: (data.work_postal_code as string) || '',
      city: (data.work_city as string) || '',
    };
  }

  // Work arrival time
  if (data.work_arrival_time) {
    prefs.workArrivalTime = data.work_arrival_time as string;
  }

  // Favorite bus stops from profile - convert VBB IDs to NearestStop objects
  const favStops = data.favorite_bus_stops as string[] | undefined;
  if (Array.isArray(favStops) && favStops.length > 0) {
    // First favorite stop is the "nearest" stop
    const firstStopVbbId = favStops[0];
    const matchedStop = ZERNSDORF_STOPS.find(s => s.vbbId === firstStopVbbId);

    if (matchedStop) {
      prefs.nearestStop = {
        id: matchedStop.id,
        name: matchedStop.name,
        vbbId: matchedStop.vbbId,
      };
    }

    // All favorites
    prefs.favoriteStops = favStops
      .map(vbbId => {
        const stop = ZERNSDORF_STOPS.find(s => s.vbbId === vbbId);
        if (stop) {
          return {
            id: stop.id,
            name: stop.name,
            vbbId: stop.vbbId,
          };
        }
        return null;
      })
      .filter((s): s is NearestStop => s !== null);
  }

  // Waste settings
  if (data.waste_street_id) {
    prefs.wasteStreetId = data.waste_street_id as string;
  }
  if (data.waste_notifications !== undefined) {
    prefs.wasteNotifications = Boolean(data.waste_notifications);
  }
  if (data.waste_notification_time) {
    prefs.wasteNotificationTime = data.waste_notification_time as string;
  }

  // Theme and language
  if (data.theme) {
    prefs.theme = data.theme as 'light' | 'dark' | 'system';
  }
  if (data.preferred_language) {
    prefs.language = data.preferred_language as 'de' | 'en';
  }

  return prefs;
}

function mapDatabaseToPreferences(dbData: Record<string, unknown>): UserPreferences {
  return {
    address: dbData.street ? {
      street: (dbData.street as string) || '',
      houseNumber: (dbData.house_number as string) || '',
      postalCode: (dbData.postal_code as string) || '',
      city: (dbData.city as string) || 'Zernsdorf',
    } : null,

    nearestStop: dbData.nearest_stop_id ? {
      id: (dbData.nearest_stop_id as string) || '',
      name: (dbData.nearest_stop_name as string) || '',
      vbbId: (dbData.nearest_stop_vbb_id as string) || '',
    } : null,

    favoriteStops: Array.isArray(dbData.favorite_bus_stops)
      ? (dbData.favorite_bus_stops as NearestStop[])
      : [],

    wasteStreetId: (dbData.waste_street_id as string) || null,
    wasteStreetName: (dbData.waste_street_name as string) || null,
    wasteNotifications: Boolean(dbData.waste_notifications),
    wasteNotificationTime: (dbData.waste_notification_time as string) || '18:00',

    workAddress: dbData.work_street ? {
      street: (dbData.work_street as string) || '',
      houseNumber: (dbData.work_house_number as string) || '',
      postalCode: (dbData.work_postal_code as string) || '',
      city: (dbData.work_city as string) || '',
    } : null,
    workArrivalTime: (dbData.work_arrival_time as string) || null,

    storeDataLocally: dbData.store_data_locally !== false,
    theme: (dbData.theme as 'light' | 'dark' | 'system') || 'system',
    language: (dbData.preferred_language as 'de' | 'en') || 'de',
  };
}

function mapPreferencesToDatabase(prefs: UserPreferences): Record<string, unknown> {
  return {
    street: prefs.address?.street || null,
    house_number: prefs.address?.houseNumber || null,
    postal_code: prefs.address?.postalCode || null,
    city: prefs.address?.city || 'Zernsdorf',

    nearest_stop_id: prefs.nearestStop?.id || null,
    nearest_stop_name: prefs.nearestStop?.name || null,
    nearest_stop_vbb_id: prefs.nearestStop?.vbbId || null,

    favorite_bus_stops: prefs.favoriteStops,

    waste_street_id: prefs.wasteStreetId,
    waste_street_name: prefs.wasteStreetName,
    waste_notifications: prefs.wasteNotifications,
    waste_notification_time: prefs.wasteNotificationTime,

    work_street: prefs.workAddress?.street || null,
    work_house_number: prefs.workAddress?.houseNumber || null,
    work_postal_code: prefs.workAddress?.postalCode || null,
    work_city: prefs.workAddress?.city || null,
    work_arrival_time: prefs.workArrivalTime,

    store_data_locally: prefs.storeDataLocally,
    theme: prefs.theme,
    preferred_language: prefs.language,
  };
}

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Gibt die gespeicherte Adresse als String zurück
 */
export function useFormattedAddress(): string | null {
  const { preferences } = useUserPreferences();
  if (!preferences.address) return null;

  const { street, houseNumber, postalCode, city } = preferences.address;
  if (!street) return null;

  return `${street} ${houseNumber}, ${postalCode} ${city}`.trim();
}

/**
 * Prüft ob eine Adresse gespeichert ist
 */
export function useHasAddress(): boolean {
  const { preferences } = useUserPreferences();
  return !!preferences.address?.street;
}

/**
 * Gibt die nächste Haltestelle zurück
 */
export function useNearestStop(): NearestStop | null {
  const { preferences } = useUserPreferences();
  return preferences.nearestStop;
}

/**
 * Gibt die Müllabfuhr-Straße zurück
 */
export function useWasteStreet(): { id: string | null; name: string | null } {
  const { preferences } = useUserPreferences();
  return {
    id: preferences.wasteStreetId,
    name: preferences.wasteStreetName,
  };
}
