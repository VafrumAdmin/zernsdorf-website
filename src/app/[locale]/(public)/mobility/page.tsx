'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  ArrowRight,
  Calendar,
  Search,
  Train,
  Bus,
  Car,
  Footprints,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  Bookmark,
  BookmarkPlus,
  Home,
  Star,
  Settings,
  X,
  Timer,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AddressSettings } from '@/components/settings';
import { ZERNSDORF_STOPS } from '@/lib/transit';

// Types
interface Location {
  type: 'stop' | 'address' | 'location';
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface JourneyLeg {
  origin: { name: string; id?: string };
  destination: { name: string; id?: string };
  departure: string;
  arrival: string;
  departurePlatform?: string;
  arrivalPlatform?: string;
  departureDelay?: number;
  arrivalDelay?: number;
  walking?: boolean;
  distance?: number;
  line?: {
    name: string;
    product: string;
    operator?: string;
  };
  direction?: string;
  cancelled?: boolean;
}

interface Journey {
  legs: JourneyLeg[];
  refreshToken?: string;
}

interface SavedRoute {
  id: string;
  name: string;
  icon: string;
  from: Location;
  to: Location;
  createdAt: string;
}

// Popular destinations with correct VBB IDs
const POPULAR_DESTINATIONS: Location[] = [
  { type: 'stop', id: '900003201', name: 'S+U Berlin Hauptbahnhof' },
  { type: 'stop', id: '900100003', name: 'S+U Alexanderplatz (Berlin)' },
  { type: 'stop', id: '900120005', name: 'S Ostbahnhof (Berlin)' },
  { type: 'stop', id: '900260001', name: 'S Königs Wusterhausen Bhf' },
  { type: 'stop', id: '900260009', name: 'Flughafen BER' },
  { type: 'stop', id: '900230999', name: 'S Potsdam Hauptbahnhof' },
  { type: 'stop', id: '900470000', name: 'Cottbus, Hauptbahnhof' },
  { type: 'stop', id: '900435602', name: 'Lübbenau (Spreewald)' },
];

// Location Search Component
function LocationSearch({
  value,
  onChange,
  onSelect,
  placeholder,
  icon: Icon,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: Location) => void;
  placeholder: string;
  icon: React.ElementType;
  id: string;
}) {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/locations?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.locations || []);
      }
    } catch {
      console.error('Location search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(newValue), 300);
  };

  const handleSelect = (location: Location) => {
    onChange(location.name);
    onSelect(location);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
          className="w-full pl-10 pr-10 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={18} />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-64 overflow-y-auto">
          {suggestions.map((loc, idx) => (
            <button
              key={`${loc.id || loc.name}-${idx}`}
              onClick={() => handleSelect(loc)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
            >
              {loc.type === 'stop' ? (
                <Train size={18} className="text-emerald-600" />
              ) : (
                <MapPin size={18} className="text-slate-400" />
              )}
              <span className="text-slate-700">{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Journey Card Component
function JourneyCard({
  journey,
  index,
  walkTimeToStart,
  driveTimeToKW,
  trafficLevel,
  locale,
  fromLocation,
  toLocation,
}: {
  journey: Journey;
  index: number;
  walkTimeToStart: number;
  driveTimeToKW: number;
  trafficLevel: 'frei' | 'leicht' | 'stockend' | 'stau';
  locale: string;
  fromLocation?: Location | null;
  toLocation?: Location | null;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  // Navigate to detail page - store journey in sessionStorage to avoid URL length issues
  // Also store original from/to locations for walking directions
  const handleShowDetails = () => {
    const journeyData = {
      journey,
      fromLocation: fromLocation ? {
        name: fromLocation.name,
        latitude: fromLocation.latitude,
        longitude: fromLocation.longitude,
      } : null,
      toLocation: toLocation ? {
        name: toLocation.name,
        latitude: toLocation.latitude,
        longitude: toLocation.longitude,
      } : null,
    };
    sessionStorage.setItem('selectedJourney', JSON.stringify(journeyData));
    window.location.href = `/${locale}/mobility/journey`;
  };

  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs[journey.legs.length - 1];

  const departureTime = new Date(firstLeg.departure);
  const arrivalTime = new Date(lastLeg.arrival);
  const durationMs = arrivalTime.getTime() - departureTime.getTime();
  const durationMin = Math.round(durationMs / 60000);

  const now = new Date();
  const minutesUntilDeparture = Math.round((departureTime.getTime() - now.getTime()) / 60000);

  // Calculate when to leave
  const leaveByTime = new Date(departureTime.getTime() - walkTimeToStart * 60000);
  const minutesUntilLeave = Math.round((leaveByTime.getTime() - now.getTime()) / 60000);

  // Count transfers (non-walking legs - 1)
  const transitLegs = journey.legs.filter(l => !l.walking);
  const transfers = Math.max(0, transitLegs.length - 1);

  // Calculate reachability
  const isReachable = minutesUntilLeave > 0;
  const isTight = minutesUntilLeave > 0 && minutesUntilLeave < 10;

  // Check if first leg is walking to station
  const startsWithWalk = firstLeg.walking;
  const walkDistance = startsWithWalk ? firstLeg.distance : 0;

  // Alternative: Drive to KW option
  const firstTransitLeg = journey.legs.find(l => !l.walking);
  const firstTransitDeparture = firstTransitLeg ? new Date(firstTransitLeg.departure) : departureTime;
  const driveLeaveBy = new Date(firstTransitDeparture.getTime() - (driveTimeToKW + 5) * 60000); // +5 min parking
  const canDriveInstead = driveLeaveBy > now && firstTransitLeg?.origin?.name?.includes('Königs Wusterhausen');

  const formatTime = (date: Date) => date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const formatDelay = (seconds?: number) => {
    if (!seconds || seconds === 0) return null;
    const min = Math.round(seconds / 60);
    return min > 0 ? `+${min}` : `${min}`;
  };

  const getProductColor = (product?: string) => {
    switch (product) {
      case 'suburban': return 'bg-green-600';
      case 'subway': return 'bg-blue-600';
      case 'regional':
      case 'express': return 'bg-red-600';
      case 'bus': return 'bg-purple-600';
      case 'tram': return 'bg-red-500';
      case 'ferry': return 'bg-cyan-600';
      default: return 'bg-slate-600';
    }
  };

  const getProductIcon = (product?: string) => {
    switch (product) {
      case 'suburban':
      case 'subway':
      case 'regional':
      case 'express': return Train;
      case 'bus': return Bus;
      default: return Train;
    }
  };

  return (
    <div className={`bg-white rounded-xl border-2 transition overflow-hidden ${
      index === 0 ? 'border-emerald-500 shadow-md' : 'border-slate-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">
          {/* Departure */}
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatTime(departureTime)}</div>
            {firstLeg.departureDelay ? (
              <span className="text-xs text-yellow-600 font-medium">{formatDelay(firstLeg.departureDelay)}</span>
            ) : (
              <span className="text-xs text-green-600">pünktlich</span>
            )}
          </div>

          <ArrowRight className="text-slate-400" size={20} />

          {/* Arrival */}
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{formatTime(arrivalTime)}</div>
            {lastLeg.arrivalDelay ? (
              <span className="text-xs text-yellow-600 font-medium">{formatDelay(lastLeg.arrivalDelay)}</span>
            ) : (
              <span className="text-xs text-green-600">pünktlich</span>
            )}
          </div>

          {/* Duration & Transfers */}
          <div className="ml-4 text-left">
            <div className="text-lg font-semibold text-slate-700">{durationMin} Min</div>
            <div className="text-sm text-slate-500">
              {transfers === 0 ? 'Direkt' : `${transfers}x Umsteigen`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Products */}
          <div className="flex gap-1">
            {transitLegs.slice(0, 3).map((leg, i) => {
              const ProductIcon = getProductIcon(leg.line?.product);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-2 py-1 rounded ${getProductColor(leg.line?.product)} text-white text-xs font-medium`}
                >
                  <ProductIcon size={12} />
                  {leg.line?.name}
                </div>
              );
            })}
          </div>

          {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </button>

      {/* Reachability Banner */}
      <div className={`px-4 py-2 flex items-center gap-2 text-sm ${
        !isReachable
          ? 'bg-red-50 text-red-700'
          : isTight
            ? 'bg-yellow-50 text-yellow-700'
            : 'bg-green-50 text-green-700'
      }`}>
        {!isReachable ? (
          <>
            <AlertCircle size={16} />
            <span>Nicht mehr erreichbar - Verbindung bereits gestartet</span>
          </>
        ) : isTight ? (
          <>
            <Timer size={16} />
            <span><strong>Jetzt losgehen!</strong> Nur noch {minutesUntilLeave} Min bis Abmarsch</span>
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            <span>
              <strong>Spätestens {formatTime(leaveByTime)} losgehen</strong>
              {walkDistance ? ` (${Math.round(walkDistance)}m Fußweg zur Haltestelle)` : ''}
            </span>
          </>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-slate-100">
          {/* Journey legs */}
          <div className="space-y-3">
            {journey.legs.map((leg, i) => (
              <div key={i} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${leg.walking ? 'bg-slate-300' : getProductColor(leg.line?.product)}`} />
                  {i < journey.legs.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[40px] ${leg.walking ? 'bg-slate-200' : getProductColor(leg.line?.product)}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800">
                        {formatTime(new Date(leg.departure))} {leg.origin.name}
                      </div>
                      {leg.walking ? (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Footprints size={14} />
                          <span>Fußweg {leg.distance ? `(${Math.round(leg.distance)}m)` : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getProductColor(leg.line?.product)}`}>
                            {leg.line?.name}
                          </span>
                          <span className="text-sm text-slate-500">→ {leg.direction}</span>
                          {leg.departurePlatform && (
                            <span className="text-sm text-slate-400">Gleis {leg.departurePlatform}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!leg.walking && (
                    <div className="mt-2 text-slate-600">
                      {formatTime(new Date(leg.arrival))} {leg.destination.name}
                      {leg.arrivalPlatform && (
                        <span className="text-sm text-slate-400 ml-2">Gleis {leg.arrivalPlatform}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Alternative: Drive to KW */}
          {canDriveInstead && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Car size={18} />
                <span className="font-medium">Alternative: Mit Auto zum Bahnhof KW</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Spätestens <strong>{formatTime(driveLeaveBy)}</strong> losfahren
                {trafficLevel !== 'frei' && (
                  <span className="text-yellow-600"> (aktuell {trafficLevel === 'leicht' ? 'leichter' : trafficLevel === 'stockend' ? 'stockender' : 'dichter'} Verkehr)</span>
                )}
              </p>
            </div>
          )}

          {index === 0 && (
            <div className="mt-3 text-sm text-emerald-600 font-medium flex items-center gap-1">
              <Star size={14} fill="currentColor" />
              Empfohlene Verbindung
            </div>
          )}

          {/* Detail Page Button */}
          <button
            onClick={handleShowDetails}
            className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Info size={18} />
            Diese Verbindung wählen – alle Details anzeigen
          </button>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function MobilityPage() {
  const locale = useLocale();
  const { preferences, isLoaded: prefsLoaded, isLoggedIn } = useUserPreferences();

  // Form state
  const [fromText, setFromText] = useState('');
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toText, setToText] = useState('');
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  const [isArrival, setIsArrival] = useState(false);

  // Results state
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earlierRef, setEarlierRef] = useState<string | null>(null);
  const [laterRef, setLaterRef] = useState<string | null>(null);

  // Traffic state
  const [trafficLevel, setTrafficLevel] = useState<'frei' | 'leicht' | 'stockend' | 'stau'>('frei');
  const [driveTimeToKW, setDriveTimeToKW] = useState(10);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  // Walking time estimate (5 min per 400m)
  const walkTimeToStart = 5;

  // Load user preferences
  useEffect(() => {
    if (prefsLoaded) {
      // Set default start from user's address or nearest stop
      if (preferences.address) {
        const addressStr = `${preferences.address.street} ${preferences.address.houseNumber}, ${preferences.address.postalCode} ${preferences.address.city}`;
        setFromText(addressStr);
        // Note: Full location needs geocoding, for now use as text
      } else if (preferences.nearestStop) {
        const stop = ZERNSDORF_STOPS.find(s => s.id === preferences.nearestStop?.id);
        if (stop) {
          setFromText(stop.name);
          setFromLocation({
            type: 'stop',
            id: stop.vbbId,
            name: stop.name,
            latitude: stop.location.lat,
            longitude: stop.location.lng,
          });
        }
      } else {
        setFromText('Zernsdorf, Bahnhof');
        const defaultStop = ZERNSDORF_STOPS.find(s => s.id === 'bahnhof');
        if (defaultStop) {
          setFromLocation({
            type: 'stop',
            id: defaultStop.vbbId,
            name: defaultStop.name,
            latitude: defaultStop.location.lat,
            longitude: defaultStop.location.lng,
          });
        }
      }

      // Load saved routes from localStorage
      const saved = localStorage.getItem('savedRoutes');
      if (saved) {
        try {
          setSavedRoutes(JSON.parse(saved));
        } catch { /* ignore */ }
      }
    }
  }, [prefsLoaded, preferences]);

  // Fetch traffic info
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const res = await fetch('/api/traffic');
        if (res.ok) {
          const data = await res.json();
          setTrafficLevel(data.overallLevel || 'frei');
          // Approximate drive time based on traffic
          const baseDrive = 8;
          const trafficMultiplier: Record<string, number> = {
            frei: 1,
            leicht: 1.25,
            stockend: 1.75,
            stau: 2.5,
          };
          setDriveTimeToKW(Math.round(baseDrive * (trafficMultiplier[data.overallLevel] || 1)));
        }
      } catch { /* ignore */ }
    };
    fetchTraffic();
  }, []);

  // Search journeys
  const searchJourneys = useCallback(async (pagination?: 'earlier' | 'later') => {
    if (!fromLocation && !fromText) return;
    if (!toLocation && !toText) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      let resolvedFrom: Location | null = fromLocation;
      let resolvedTo: Location | null = toLocation;

      // From location - resolve if needed
      if (!resolvedFrom && fromText) {
        const locRes = await fetch(`/api/locations?query=${encodeURIComponent(fromText)}`);
        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.locations?.length > 0) {
            resolvedFrom = locData.locations[0];
          }
        }
      }

      // To location - resolve if needed
      if (!resolvedTo && toText) {
        const locRes = await fetch(`/api/locations?query=${encodeURIComponent(toText)}`);
        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.locations?.length > 0) {
            resolvedTo = locData.locations[0];
          }
        }
      }

      // Check if we have valid from/to
      if (!resolvedFrom || !resolvedTo) {
        setError('Start oder Ziel konnte nicht gefunden werden');
        setLoading(false);
        return;
      }

      // Build from params - different handling for stops vs addresses
      if (resolvedFrom.type === 'stop' && resolvedFrom.id) {
        params.set('from', resolvedFrom.id);
        params.set('fromType', 'stop');
      } else if (resolvedFrom.latitude && resolvedFrom.longitude) {
        params.set('from', resolvedFrom.name);
        params.set('fromLat', String(resolvedFrom.latitude));
        params.set('fromLng', String(resolvedFrom.longitude));
        params.set('fromName', resolvedFrom.name);
        params.set('fromType', 'address');
      } else if (resolvedFrom.id) {
        params.set('from', resolvedFrom.id);
      } else {
        setError('Startort konnte nicht verarbeitet werden');
        setLoading(false);
        return;
      }

      // Build to params
      if (resolvedTo.type === 'stop' && resolvedTo.id) {
        params.set('to', resolvedTo.id);
        params.set('toType', 'stop');
      } else if (resolvedTo.latitude && resolvedTo.longitude) {
        params.set('to', resolvedTo.name);
        params.set('toLat', String(resolvedTo.latitude));
        params.set('toLng', String(resolvedTo.longitude));
        params.set('toName', resolvedTo.name);
        params.set('toType', 'address');
      } else if (resolvedTo.id) {
        params.set('to', resolvedTo.id);
      } else {
        setError('Zielort konnte nicht verarbeitet werden');
        setLoading(false);
        return;
      }

      // Date & time
      if (!pagination) {
        const dateTime = `${date}T${time}`;
        if (isArrival) {
          params.set('arrival', dateTime);
        } else {
          params.set('departure', dateTime);
        }
      } else if (pagination === 'earlier' && earlierRef) {
        params.set('earlierThan', earlierRef);
      } else if (pagination === 'later' && laterRef) {
        params.set('laterThan', laterRef);
      }

      params.set('results', '5');

      console.log('[Mobility] Searching journeys:', params.toString());
      const res = await fetch(`/api/journeys?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Mobility] API Error:', res.status, errorData);
        throw new Error(errorData.details || 'Verbindungssuche fehlgeschlagen');
      }

      const data = await res.json();
      console.log('[Mobility] Found journeys:', data.journeys?.length || 0);

      if (pagination === 'earlier') {
        setJourneys(prev => [...(data.journeys || []), ...prev]);
      } else if (pagination === 'later') {
        setJourneys(prev => [...prev, ...(data.journeys || [])]);
      } else {
        setJourneys(data.journeys || []);
      }

      setEarlierRef(data.earlierRef || null);
      setLaterRef(data.laterRef || null);

      if (!data.journeys?.length && !pagination) {
        setError('Keine Verbindungen gefunden');
      }
    } catch (err) {
      console.error('[Mobility] Search error:', err);
      setError(err instanceof Error ? err.message : 'Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  }, [fromLocation, fromText, toLocation, toText, date, time, isArrival, earlierRef, laterRef]);

  // Save route
  const saveRoute = () => {
    if (!fromLocation || !toLocation) return;

    const newRoute: SavedRoute = {
      id: Date.now().toString(),
      name: `${fromLocation.name.split(',')[0]} → ${toLocation.name.split(',')[0]}`,
      icon: 'route',
      from: fromLocation,
      to: toLocation,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedRoutes, newRoute];
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
  };

  // Load saved route
  const loadRoute = (route: SavedRoute) => {
    setFromText(route.from.name);
    setFromLocation(route.from);
    setToText(route.to.name);
    setToLocation(route.to);
  };

  // Delete saved route
  const deleteRoute = (id: string) => {
    const updated = savedRoutes.filter(r => r.id !== id);
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
  };

  // Quick select popular destination
  const selectPopularDestination = (dest: Location) => {
    setToText(dest.name);
    setToLocation(dest);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/" className="hover:text-emerald-600">Startseite</Link>
            <span>/</span>
            <span className="text-slate-700">Reiseplanung</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Reiseplanung</h1>
              <p className="text-slate-600 mt-1">
                Von Zernsdorf überall hin - Arbeitsweg, Tagesausflug oder Urlaub
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Einstellungen"
            >
              <Settings size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6">
            <AddressSettings
              compact={false}
              showStorageOption={true}
              onSaved={() => setShowSettings(false)}
            />
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="space-y-4">
            {/* From */}
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-slate-700 mb-1">
                Von
              </label>
              <LocationSearch
                id="from"
                value={fromText}
                onChange={setFromText}
                onSelect={(loc) => setFromLocation(loc)}
                placeholder="Startort eingeben..."
                icon={Home}
              />
              {preferences.nearestStop && fromText !== preferences.nearestStop.name && (
                <button
                  onClick={() => {
                    const stop = ZERNSDORF_STOPS.find(s => s.id === preferences.nearestStop?.id);
                    if (stop) {
                      setFromText(stop.name);
                      setFromLocation({
                        type: 'stop',
                        id: stop.vbbId,
                        name: stop.name,
                      });
                    }
                  }}
                  className="text-sm text-emerald-600 hover:underline mt-1"
                >
                  Meine Haltestelle: {preferences.nearestStop.name}
                </button>
              )}
            </div>

            {/* To */}
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-slate-700 mb-1">
                Nach
              </label>
              <LocationSearch
                id="to"
                value={toText}
                onChange={setToText}
                onSelect={(loc) => setToLocation(loc)}
                placeholder="Ziel eingeben..."
                icon={MapPin}
              />

              {/* Quick destinations */}
              <div className="flex flex-wrap gap-2 mt-2">
                {POPULAR_DESTINATIONS.slice(0, 4).map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => selectPopularDestination(dest)}
                    className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
                  >
                    {dest.name.split(',')[0]}
                  </button>
                ))}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition"
                >
                  Mehr...
                </button>
              </div>

              {showAdvanced && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Weitere Ziele:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DESTINATIONS.slice(4).map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => selectPopularDestination(dest)}
                        className="text-sm px-3 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-slate-600 transition"
                      >
                        {dest.name.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                  Datum
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">
                  <button
                    onClick={() => setIsArrival(!isArrival)}
                    className="flex items-center gap-1 hover:text-emerald-600"
                  >
                    {isArrival ? 'Ankunft um' : 'Abfahrt um'}
                    <ChevronDown size={14} />
                  </button>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={() => searchJourneys()}
              disabled={loading || (!toText && !toLocation)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Suche Verbindungen...
                </>
              ) : (
                <>
                  <Search size={24} />
                  Verbindungen suchen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Routes (for logged in users) */}
        {isLoggedIn && savedRoutes.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <Bookmark size={18} className="text-amber-500" />
              Gespeicherte Routen
            </h3>
            <div className="space-y-2">
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <button
                    onClick={() => loadRoute(route)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-slate-700">{route.name}</div>
                    <div className="text-sm text-slate-500">{route.from.name}</div>
                  </button>
                  <button
                    onClick={() => deleteRoute(route.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Results */}
        {journeys.length > 0 && (
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">
                Verbindungen
              </h2>
              <div className="flex items-center gap-2">
                {isLoggedIn && fromLocation && toLocation && (
                  <button
                    onClick={saveRoute}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition"
                  >
                    <BookmarkPlus size={16} />
                    Route speichern
                  </button>
                )}
                <button
                  onClick={() => searchJourneys()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <RefreshCw size={16} />
                  Aktualisieren
                </button>
              </div>
            </div>

            {/* Load Earlier */}
            {earlierRef && (
              <button
                onClick={() => searchJourneys('earlier')}
                disabled={loading}
                className="w-full py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center gap-2"
              >
                <ChevronUp size={16} />
                Frühere Verbindungen laden
              </button>
            )}

            {/* Journey Cards */}
            {journeys.map((journey, i) => (
              <JourneyCard
                key={i}
                journey={journey}
                index={i}
                walkTimeToStart={walkTimeToStart}
                driveTimeToKW={driveTimeToKW}
                trafficLevel={trafficLevel}
                locale={locale}
                fromLocation={fromLocation}
                toLocation={toLocation}
              />
            ))}

            {/* Load Later */}
            {laterRef && (
              <button
                onClick={() => searchJourneys('later')}
                disabled={loading}
                className="w-full py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center gap-2"
              >
                <ChevronDown size={16} />
                Spätere Verbindungen laden
              </button>
            )}
          </div>
        )}

        {/* Info for not logged in users */}
        {!isLoggedIn && journeys.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="text-amber-600 mt-0.5" size={20} />
              <div>
                <p className="text-amber-800 font-medium">Route speichern?</p>
                <p className="text-amber-700 text-sm mt-1">
                  Mit einem Account kannst du häufig genutzte Routen speichern und schnell wieder aufrufen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {journeys.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Info size={18} />
              Tipps zur Reiseplanung
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Arbeitsweg:</strong> Speichere regelmäßige Routen für schnellen Zugriff</li>
              <li>• <strong>Fußweg:</strong> Die Anzeige berücksichtigt den Fußweg zur Haltestelle</li>
              <li>• <strong>Auto-Alternative:</strong> Bei Verbindungen über KW wird die Auto-Option angezeigt</li>
              <li>• <strong>Aktuelle Verkehrslage:</strong> {trafficLevel === 'frei' ? 'Freie Fahrt' : trafficLevel === 'leicht' ? 'Leichter Verkehr' : trafficLevel === 'stockend' ? 'Stockender Verkehr' : 'Stau'} nach KW</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
