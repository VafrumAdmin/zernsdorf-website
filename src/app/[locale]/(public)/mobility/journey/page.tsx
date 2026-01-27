'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Train,
  Bus,
  Footprints,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  List,
  Navigation,
  Calendar,
  Timer,
  AlertCircle,
  Clock,
  Printer,
  Loader2,
  Construction,
  Check,
  Square,
  CornerDownRight,
  RotateCcw,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Milestone,
  Map,
} from 'lucide-react';

// Lazy load the map component to avoid SSR issues
const WalkingRouteMap = lazy(() => import('@/components/maps/WalkingRouteMap'));

// Types
interface JourneyLeg {
  origin: { name: string; id?: string; latitude?: number; longitude?: number };
  destination: { name: string; id?: string; latitude?: number; longitude?: number };
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
  stopovers?: Array<{
    stop: { name: string; id: string };
    arrival: string | null;
    departure: string | null;
  }>;
}

interface Journey {
  legs: JourneyLeg[];
  refreshToken?: string;
}

interface WalkingStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface WalkingDirections {
  steps: WalkingStep[];
  totalDistance: number;
  totalDuration: number;
  coordinates: [number, number][];
}

// Helper functions
function getProductColor(product?: string) {
  switch (product) {
    case 'suburban': return 'bg-green-600';
    case 'subway': return 'bg-blue-700';
    case 'regional':
    case 'express': return 'bg-red-600';
    case 'bus': return 'bg-purple-700';
    case 'tram': return 'bg-red-500';
    default: return 'bg-slate-700';
  }
}

function getProductBgLight(product?: string) {
  switch (product) {
    case 'suburban': return 'bg-green-50 border-green-200';
    case 'subway': return 'bg-blue-50 border-blue-200';
    case 'regional':
    case 'express': return 'bg-red-50 border-red-200';
    case 'bus': return 'bg-purple-50 border-purple-200';
    default: return 'bg-slate-50 border-slate-200';
  }
}

// Get instruction icon
function getInstructionIcon(instruction: string) {
  const lower = instruction.toLowerCase();
  if (lower.includes('links') && lower.includes('scharf')) return <CornerUpLeft size={20} className="text-blue-600" />;
  if (lower.includes('rechts') && lower.includes('scharf')) return <CornerUpRight size={20} className="text-blue-600" />;
  if (lower.includes('links')) return <ArrowUpLeft size={20} className="text-blue-600" />;
  if (lower.includes('rechts')) return <ArrowUpRight size={20} className="text-blue-600" />;
  if (lower.includes('geradeaus') || lower.includes('weiter')) return <ArrowUp size={20} className="text-blue-600" />;
  if (lower.includes('ziel')) return <MapPin size={20} className="text-green-600" />;
  if (lower.includes('start')) return <Milestone size={20} className="text-blue-600" />;
  return <Navigation size={20} className="text-blue-600" />;
}

// Map Loading Fallback
function MapLoadingFallback() {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-blue-50 h-[300px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={32} />
        <p className="text-slate-600">Karte wird geladen...</p>
      </div>
    </div>
  );
}

// Walking Directions Display Component
function WalkingDirectionsDisplay({
  directions,
  fromName,
  toName,
  isLoading,
  error,
}: {
  directions: WalkingDirections | null;
  fromName: string;
  toName: string;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl">
        <Loader2 className="animate-spin text-blue-500 mr-3" size={24} />
        <span className="text-slate-600">Lade Wegbeschreibung...</span>
      </div>
    );
  }

  if (error || !directions) {
    // Fallback if no directions available
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded-xl flex items-center gap-4">
          <Footprints size={32} className="text-blue-700" />
          <div>
            <p className="text-xl font-bold text-blue-800">Fußweg</p>
            <p className="text-blue-700">Von {fromName.split(',')[0]} nach {toName.split(',')[0]}</p>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800">
            <strong>💡 Hinweis:</strong> Orientieren Sie sich an Straßenschildern oder fragen Sie Passanten nach dem Weg.
          </p>
        </div>
      </div>
    );
  }

  const walkMinutes = Math.ceil(directions.totalDuration / 60);

  return (
    <div className="space-y-4">
      {/* Interactive Map with route */}
      {directions.coordinates && directions.coordinates.length > 0 && (
        <Suspense fallback={<MapLoadingFallback />}>
          <WalkingRouteMap
            coordinates={directions.coordinates}
            fromName={fromName}
            toName={toName}
            height="350px"
          />
        </Suspense>
      )}

      {/* Summary */}
      <div className="p-4 bg-blue-100 rounded-xl flex items-center gap-4">
        <Footprints size={32} className="text-blue-700" />
        <div>
          <p className="text-2xl font-bold text-blue-800">
            {directions.totalDistance}m Fußweg
          </p>
          <p className="text-blue-700">ca. {walkMinutes} Minuten</p>
        </div>
      </div>

      {/* Step by step directions */}
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden print:border">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <List size={20} />
            Wegbeschreibung zum Ausdrucken
          </h4>
          <p className="text-blue-100 text-sm mt-1">
            Von {fromName.split(',')[0]} nach {toName.split(',')[0]}
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {directions.steps.map((step, idx) => (
            <div key={idx} className="p-4 flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                  {idx + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getInstructionIcon(step.instruction)}</div>
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">{step.instruction}</p>
                    <p className="text-slate-600 mt-1">
                      <span className="font-medium">{step.distance}m</span> gehen
                      <span className="text-slate-400 ml-2">
                        (ca. {Math.ceil(step.distance / 80)} Min)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Final destination */}
          <div className="p-4 bg-green-50 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <Check size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-lg">🎯 Ziel erreicht!</p>
              <p className="text-green-700">{toName}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Lookup coordinates from VBB API if missing
async function lookupCoordinates(name: string, id?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // If we have an ID, try to get stop info first
    if (id) {
      const stopRes = await fetch(`https://v6.vbb.transport.rest/stops/${id}`);
      if (stopRes.ok) {
        const stopData = await stopRes.json();
        if (stopData.location?.latitude && stopData.location?.longitude) {
          return { lat: stopData.location.latitude, lng: stopData.location.longitude };
        }
      }
    }

    // Fallback: search by name
    const res = await fetch(`/api/locations?query=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.locations?.[0]?.latitude && data.locations?.[0]?.longitude) {
        return { lat: data.locations[0].latitude, lng: data.locations[0].longitude };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Walking Section Component with API call
function WalkingSection({
  leg,
  title,
  id,
  selected,
  onToggle,
  isPrinting = false,
}: {
  leg: JourneyLeg;
  title: string;
  id: string;
  selected: boolean;
  onToggle: () => void;
  isPrinting?: boolean;
}) {
  const [directions, setDirections] = useState<WalkingDirections | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [fetched, setFetched] = useState(false);

  // When printing, always show content if selected
  const showContent = isPrinting ? selected : open;
  const [resolvedCoords, setResolvedCoords] = useState<{
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  } | null>(null);

  // Use names if available, or provide fallback
  const originName = leg.origin.name || 'Ihr Standort';
  const destName = leg.destination.name || 'Ziel';

  // First: Try to resolve coordinates if missing
  useEffect(() => {
    if (fetched) return;

    const resolve = async () => {
      let fromLat = leg.origin.latitude;
      let fromLng = leg.origin.longitude;
      let toLat = leg.destination.latitude;
      let toLng = leg.destination.longitude;

      // If origin coords missing, try to look them up (if we have a name or ID)
      if ((!fromLat || !fromLng) && (leg.origin.name || leg.origin.id)) {
        console.log('[WalkingSection] Looking up origin coords for:', leg.origin.name || leg.origin.id);
        const originCoords = await lookupCoordinates(leg.origin.name || '', leg.origin.id);
        if (originCoords) {
          fromLat = originCoords.lat;
          fromLng = originCoords.lng;
          console.log('[WalkingSection] Found origin coords:', originCoords);
        }
      }

      // If destination coords missing, try to look them up (if we have a name or ID)
      if ((!toLat || !toLng) && (leg.destination.name || leg.destination.id)) {
        console.log('[WalkingSection] Looking up destination coords for:', leg.destination.name || leg.destination.id);
        const destCoords = await lookupCoordinates(leg.destination.name || '', leg.destination.id);
        if (destCoords) {
          toLat = destCoords.lat;
          toLng = destCoords.lng;
          console.log('[WalkingSection] Found destination coords:', destCoords);
        }
      }

      // If we have all coords now, set them
      if (fromLat && fromLng && toLat && toLng) {
        setResolvedCoords({ fromLat, fromLng, toLat, toLng });
      }

      setFetched(true);
    };

    // Check if we already have coords
    if (leg.origin.latitude && leg.origin.longitude && leg.destination.latitude && leg.destination.longitude) {
      setResolvedCoords({
        fromLat: leg.origin.latitude,
        fromLng: leg.origin.longitude,
        toLat: leg.destination.latitude,
        toLng: leg.destination.longitude,
      });
      setFetched(true);
    } else {
      resolve();
    }
  }, [fetched, leg.origin.name, leg.origin.id, leg.origin.latitude, leg.origin.longitude, leg.destination.name, leg.destination.id, leg.destination.latitude, leg.destination.longitude]);

  // Second: Fetch walking directions when we have coords
  useEffect(() => {
    if (!resolvedCoords || directions || error || loading) return;

    setLoading(true);
    const url = `/api/walking-directions?fromLat=${resolvedCoords.fromLat}&fromLng=${resolvedCoords.fromLng}&toLat=${resolvedCoords.toLat}&toLng=${resolvedCoords.toLng}`;
    console.log('[WalkingSection] Fetching directions:', url);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log('[WalkingSection] Directions response:', data);
        if (data.error) {
          setError(data.error);
        } else {
          setDirections(data);
        }
      })
      .catch((err) => {
        console.error('[WalkingSection] Fetch error:', err);
        setError('Fehler beim Laden');
      })
      .finally(() => setLoading(false));
  }, [resolvedCoords, directions, error, loading]);

  // Check if we have coordinates (either from leg or resolved)
  const hasCoords = !!(resolvedCoords);

  // Create Google Maps link as fallback
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/${resolvedCoords.fromLat},${resolvedCoords.fromLng}/${resolvedCoords.toLat},${resolvedCoords.toLng}/@${resolvedCoords.fromLat},${resolvedCoords.fromLng},15z/data=!4m2!4m1!3e2`
    : `https://www.google.com/maps/dir/${encodeURIComponent(originName)}/${encodeURIComponent(destName)}?travelmode=walking`;

  const walkMinutes = leg.distance ? Math.ceil(leg.distance / 80) : 5;

  // Show loading while resolving coordinates
  const isResolving = !fetched;

  // Don't render at all if printing and not selected
  if (isPrinting && !selected) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl border-2 print:border ${selected ? 'border-emerald-500 ring-2 ring-emerald-200 print:ring-0 print:border-slate-300' : 'border-slate-200'} print:break-inside-avoid`}>
      <div className="flex">
        <button onClick={onToggle} className="p-3 border-r border-slate-100 hover:bg-slate-50 print:hidden">
          {selected ? (
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          ) : (
            <Square size={24} className="text-slate-300" />
          )}
        </button>
        <button onClick={() => setOpen(!open)} className="flex-1 p-4 flex items-center justify-between hover:bg-slate-50 print:hover:bg-white">
          <div className="flex items-center gap-3">
            <Navigation size={20} className="text-blue-600" />
            <span className="font-medium text-slate-800">{title}</span>
            {leg.distance && (
              <span className="text-sm text-slate-500">({Math.round(leg.distance)}m, ca. {walkMinutes} Min)</span>
            )}
          </div>
          <span className="print:hidden">
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </button>
      </div>
      {showContent && (
        <div className="p-4 border-t border-slate-100">
          {isResolving ? (
            <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl">
              <Loader2 className="animate-spin text-blue-500 mr-3" size={24} />
              <span className="text-slate-600">Lade Standort-Daten...</span>
            </div>
          ) : hasCoords ? (
            <WalkingDirectionsDisplay
              directions={directions}
              fromName={originName}
              toName={destName}
              isLoading={loading}
              error={error}
            />
          ) : (
            // Fallback when no coordinates - show clear message with Google Maps link
            <div className="space-y-4">
              <div className="p-4 bg-blue-100 rounded-xl flex items-center gap-4">
                <Footprints size={32} className="text-blue-700" />
                <div>
                  <p className="text-xl font-bold text-blue-800">
                    {leg.distance ? `${Math.round(leg.distance)}m Fußweg` : 'Fußweg'}
                  </p>
                  <p className="text-blue-700">ca. {walkMinutes} Minuten</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <MapPin className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-slate-800">Von: {originName}</p>
                    <p className="font-medium text-slate-800 mt-1">Nach: {destName}</p>
                  </div>
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-semibold transition"
              >
                📍 Route in Google Maps öffnen
              </a>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-sm">
                  <strong>💡 Tipp:</strong> Öffnen Sie den Google Maps Link und drucken Sie die Wegbeschreibung dort aus.
                  Orientieren Sie sich an Straßenschildern oder fragen Sie Passanten.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Section Component
function Section({
  id,
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  selected,
  onToggle,
  isPrinting = false,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  selected: boolean;
  onToggle: () => void;
  isPrinting?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // When printing, show content only if selected
  const showContent = isPrinting ? selected : open;

  // Don't render at all if printing and not selected
  if (isPrinting && !selected) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl border-2 print:border ${selected ? 'border-emerald-500 ring-2 ring-emerald-200 print:ring-0 print:border-slate-300' : 'border-slate-200'} print:break-inside-avoid`}>
      <div className="flex">
        <button onClick={onToggle} className="p-3 border-r border-slate-100 hover:bg-slate-50 print:hidden">
          {selected ? (
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          ) : (
            <Square size={24} className="text-slate-300" />
          )}
        </button>
        <button onClick={() => setOpen(!open)} className="flex-1 p-4 flex items-center justify-between hover:bg-slate-50 print:hover:bg-white print:cursor-default">
          <div className="flex items-center gap-3">
            <Icon size={20} className="text-slate-600" />
            <span className="font-medium text-slate-800">{title}</span>
          </div>
          <span className="print:hidden">
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </button>
      </div>
      {showContent && <div className="p-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// Main Component
export default function JourneyDetailPage() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'de';
  const [journey, setJourney] = useState<Journey | null>(null);
  const [fromLocation, setFromLocation] = useState<{ name: string; latitude?: number; longitude?: number } | null>(null);
  const [toLocation, setToLocation] = useState<{ name: string; latitude?: number; longitude?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set(['steps', 'walk-start', 'walk-end']));
  const [isPrinting, setIsPrinting] = useState(false);

  // Print function - temporarily set isPrinting to true so all selected sections expand
  const handlePrint = () => {
    setIsPrinting(true);
    // Wait for React to re-render with all sections open
    setTimeout(() => {
      window.print();
      // Reset after print dialog closes
      setTimeout(() => setIsPrinting(false), 500);
    }, 100);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedJourney');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Handle both old format (just journey) and new format (with locations)
        if (data.journey) {
          setJourney(data.journey);
          setFromLocation(data.fromLocation || null);
          setToLocation(data.toLocation || null);
          console.log('[Journey Detail] Loaded with locations:', {
            from: data.fromLocation,
            to: data.toLocation
          });
        } else if (data.legs) {
          // Old format - just the journey object
          setJourney(data);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
    setLoading(false);
  }, []);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
            <h1 className="text-xl font-bold text-red-800">Verbindung nicht gefunden</h1>
            <p className="text-red-600 mt-2">Bitte wählen Sie eine Verbindung auf der Reiseplanungsseite aus.</p>
            <Link href={`/${locale}/mobility`} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg">
              <ArrowLeft size={16} />
              Zur Reiseplanung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs[journey.legs.length - 1];
  const departureTime = new Date(firstLeg.departure);
  const arrivalTime = new Date(lastLeg.arrival);
  const durationMin = Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60000);
  const transitLegs = journey.legs.filter(l => !l.walking);

  // Identify relevant walking legs
  // Show walking sections if there's a walking leg with significant distance (>30m)
  // Names can be missing for address-based queries, we'll use coordinates or fallback names
  let firstWalkingLeg = journey.legs[0].walking &&
    journey.legs[0].distance && journey.legs[0].distance > 30
    ? { ...journey.legs[0] }
    : null;

  const lastLegIdx = journey.legs.length - 1;
  let lastWalkingLeg = lastLegIdx > 0 &&
    journey.legs[lastLegIdx].walking &&
    journey.legs[lastLegIdx].distance && journey.legs[lastLegIdx].distance > 30
    ? { ...journey.legs[lastLegIdx] }
    : null;

  // Inject original from/to coordinates if missing from walking legs
  if (firstWalkingLeg && fromLocation) {
    if (!firstWalkingLeg.origin.latitude && fromLocation.latitude) {
      firstWalkingLeg.origin = {
        ...firstWalkingLeg.origin,
        name: firstWalkingLeg.origin.name || fromLocation.name,
        latitude: fromLocation.latitude,
        longitude: fromLocation.longitude,
      };
    }
  }

  if (lastWalkingLeg && toLocation) {
    if (!lastWalkingLeg.destination.latitude && toLocation.latitude) {
      lastWalkingLeg.destination = {
        ...lastWalkingLeg.destination,
        name: lastWalkingLeg.destination.name || toLocation.name,
        latitude: toLocation.latitude,
        longitude: toLocation.longitude,
      };
    }
  }

  // Debug: Log walking leg info
  console.log('[Journey Detail] First walking leg:', firstWalkingLeg ? {
    from: firstWalkingLeg.origin,
    to: firstWalkingLeg.destination,
    distance: firstWalkingLeg.distance
  } : 'none');
  console.log('[Journey Detail] Last walking leg:', lastWalkingLeg ? {
    from: lastWalkingLeg.origin,
    to: lastWalkingLeg.destination,
    distance: lastWalkingLeg.distance
  } : 'none');
  console.log('[Journey Detail] Original locations:', { fromLocation, toLocation });

  const firstWalkDist = firstWalkingLeg?.distance || 0;
  const walkTimeMin = firstWalkDist ? Math.ceil(firstWalkDist / 80) : 5;
  const leaveByTime = new Date(departureTime.getTime() - walkTimeMin * 60000);

  const fmt = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const isFuture = departureTime > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-slate-50 py-8 print:py-2 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 print:px-2">
        {/* Back */}
        <Link href={`/${locale}/mobility`} className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 mb-4 print:hidden">
          <ArrowLeft size={20} /> Zurück
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6 print:shadow-none print:p-4 print:mb-4">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold print:text-xl">Ihre Verbindung</h1>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 print:hidden">
              <Printer size={18} /> Drucken
            </button>
          </div>

          <p className="text-slate-600 mb-4 flex items-center gap-2">
            <Calendar size={18} /> {fmtDate(departureTime)}
          </p>

          {/* Times */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold print:text-2xl">{fmt(departureTime)}</p>
              <p className="text-sm text-slate-500">{firstLeg.origin.name}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-1 flex-1 bg-slate-200" />
              <span className="px-3 py-1 bg-slate-100 rounded-full text-sm">{durationMin} Min</span>
              <div className="h-1 flex-1 bg-slate-200" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold print:text-2xl">{fmt(arrivalTime)}</p>
              <p className="text-sm text-slate-500">{lastLeg.destination.name}</p>
            </div>
          </div>

          {/* Products */}
          <div className="flex flex-wrap gap-2 mb-4">
            {transitLegs.map((leg, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white ${getProductColor(leg.line?.product)}`}>
                {leg.line?.product === 'bus' ? <Bus size={16} /> : <Train size={16} />}
                <span className="font-bold">{leg.line?.name}</span>
                <span className="opacity-80 text-sm">→ {leg.direction}</span>
              </div>
            ))}
          </div>

          {/* Leave-by */}
          <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-xl flex items-center gap-3 print:p-3">
            <Timer className="text-emerald-700" size={32} />
            <div>
              <p className="text-2xl font-bold text-emerald-800 print:text-xl">⏰ Spätestens {fmt(leaveByTime)} losgehen!</p>
              <p className="text-emerald-700">{firstWalkDist ? `${Math.round(firstWalkDist)}m Fußweg eingeplant` : 'Ca. 5 Min Puffer'}</p>
            </div>
          </div>
        </div>

        {/* Construction warning */}
        {isFuture && (
          <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-xl mb-6 flex gap-3 print:mb-4">
            <Construction className="text-orange-600 flex-shrink-0" size={28} />
            <div>
              <h4 className="font-bold text-orange-800">⚠️ Hinweis</h4>
              <p className="text-orange-700">Fahrt liegt &gt;1 Woche in der Zukunft. Bitte vor Reiseantritt nochmals prüfen.</p>
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-sm flex items-center gap-2 print:hidden">
          <Info size={16} />
          Kästchen anklicken um Abschnitte für den Druck auszuwählen.
        </div>

        {/* Sections */}
        <div className="space-y-4 print:space-y-3">

          {/* FIRST: Walking to first station */}
          {firstWalkingLeg && (
            <WalkingSection
              leg={firstWalkingLeg}
              title="🚶 Weg zur ersten Haltestelle"
              id="walk-start"
              selected={selected.has('walk-start')}
              onToggle={() => toggle('walk-start')}
              isPrinting={isPrinting}
            />
          )}

          {/* Journey steps */}
          <Section id="steps" title="Reiseverlauf Schritt für Schritt" icon={List} defaultOpen selected={selected.has('steps')} onToggle={() => toggle('steps')} isPrinting={isPrinting}>
            <div className="space-y-3">
              {journey.legs.map((leg, idx) => {
                // Skip first and last walking legs (handled separately)
                if (leg.walking) {
                  if (idx === 0 || idx === journey.legs.length - 1) {
                    return null;
                  }
                  // Internal transfer walk (platform change)
                  return (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600">
                      <CornerDownRight size={18} />
                      <span>Umstieg: {leg.distance ? `${leg.distance}m` : ''} zum nächsten Gleis/Bahnsteig</span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`p-4 rounded-xl border-2 ${getProductBgLight(leg.line?.product)}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded text-white font-bold ${getProductColor(leg.line?.product)}`}>
                        {leg.line?.name}
                      </span>
                      <span className="text-slate-600">Richtung {leg.direction}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-slate-500">📍 EINSTEIGEN</p>
                        <p className="font-bold">{leg.origin.name}</p>
                        <p className="text-2xl font-bold print:text-xl">{fmt(new Date(leg.departure))}</p>
                        {leg.departurePlatform && <p className="text-slate-500">Gleis {leg.departurePlatform}</p>}
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-slate-500">🔔 AUSSTEIGEN</p>
                        <p className="font-bold">{leg.destination.name}</p>
                        <p className="text-2xl font-bold print:text-xl">{fmt(new Date(leg.arrival))}</p>
                        {leg.arrivalPlatform && <p className="text-slate-500">Gleis {leg.arrivalPlatform}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Stopovers per transit leg */}
          {transitLegs.map((leg, idx) => (
            <Section
              key={`stops-${idx}`}
              id={`stops-${idx}`}
              title={`Haltestellen ${leg.line?.name} (${leg.origin.name.split(',')[0]} → ${leg.destination.name.split(',')[0]})`}
              icon={MapPin}
              selected={selected.has(`stops-${idx}`)}
              onToggle={() => toggle(`stops-${idx}`)}
              isPrinting={isPrinting}
            >
              {leg.stopovers && leg.stopovers.length > 0 ? (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 rounded-lg flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-800">{leg.origin.name}</p>
                      <p className="text-sm text-emerald-600">Einstieg</p>
                    </div>
                    <p className="font-bold text-emerald-800">{fmt(new Date(leg.departure))}</p>
                  </div>
                  {leg.stopovers.map((stop, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-300 ml-0.5" />
                      <div className="flex-1">
                        <p className="text-slate-700">{stop.stop.name}</p>
                        <p className="text-sm text-slate-500">➡️ Noch {leg.stopovers!.length - i} Stationen</p>
                      </div>
                      <p className="text-slate-600">{stop.arrival ? fmt(new Date(stop.arrival)) : '--:--'}</p>
                    </div>
                  ))}
                  <div className="p-3 bg-red-50 rounded-lg flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800">{leg.destination.name}</p>
                      <p className="text-sm text-red-600 font-bold">🔔 HIER AUSSTEIGEN!</p>
                    </div>
                    <p className="font-bold text-red-800">{fmt(new Date(leg.arrival))}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Keine Zwischenhalte verfügbar</p>
              )}

              {/* Next connections hint */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Falls Sie den {leg.line?.name} verpassen:
                </h4>
                <p className="text-amber-700 mt-2">
                  Der nächste {leg.line?.name} fährt ca. {leg.line?.product === 'bus' ? '30' : '20'} Minuten später.
                  Prüfen Sie die Anzeigetafel an der Haltestelle.
                </p>
              </div>
            </Section>
          ))}

          {/* LAST: Walking to final destination */}
          {lastWalkingLeg && (
            <WalkingSection
              leg={lastWalkingLeg}
              title="🚶 Weg zum Ziel"
              id="walk-end"
              selected={selected.has('walk-end')}
              onToggle={() => toggle('walk-end')}
              isPrinting={isPrinting}
            />
          )}

          {/* Return journey - realistic info */}
          <Section id="return" title="🔄 Rückfahrt" icon={RotateCcw} selected={selected.has('return')} onToggle={() => toggle('return')} isPrinting={isPrinting}>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                  <Clock size={20} />
                  Rückfahrt von {lastLeg.destination.name.split(',')[0]}
                </h4>
                <p className="text-blue-700 mb-3">
                  <strong>Ihre Rückroute:</strong> {lastLeg.destination.name.split(',')[0]} → {firstLeg.origin.name.split(',')[0]}
                </p>
                <p className="text-slate-600 text-sm">
                  Prüfen Sie die Abfahrtszeiten an der Anzeigetafel am Bahnhof/Haltestelle.
                </p>
              </div>

              {/* Late night warning */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                  <AlertTriangle size={20} />
                  ⚠️ Wichtig: Letzte Verbindungen beachten!
                </h4>
                <div className="space-y-3 text-amber-800">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-semibold">🚌 Bus 721 (Zernsdorf ↔ Königs Wusterhausen)</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• <strong>Letzter Bus ab KW:</strong> ca. 19:30 Uhr (Mo-Fr), ca. 18:00 Uhr (Sa), kein Bus (So)</li>
                      <li>• <strong>Takt:</strong> Nur wenige Fahrten pro Tag, NICHT stündlich!</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-semibold">🚆 RE/RB Züge</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Letzte Züge fahren ca. bis 23:00-00:00 Uhr</li>
                      <li>• <strong>Zernsdorf Bahnhof:</strong> Nur wenige Züge halten dort!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Alternative options */}
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-3">🚕 Wenn der letzte Bus weg ist:</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-semibold text-slate-800">Option 1: Taxi ab Königs Wusterhausen</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>• <strong>Taxi Königs Wusterhausen:</strong> 03375 / 29 29 29</li>
                      <li>• <strong>Taxi Dahme-Spreewald:</strong> 03375 / 21 21 21</li>
                      <li>• Kosten nach Zernsdorf: ca. 15-20 €</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="font-semibold text-slate-800">Option 2: Zug bis Zernsdorf Bahnhof + Fußweg</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>• RE2 Richtung Cottbus hält in Zernsdorf</li>
                      <li>• Vom Bahnhof sind es ca. 15-25 Min Fußweg ins Dorf</li>
                      <li>• <strong>Achtung:</strong> Nicht alle Züge halten in Zernsdorf!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick tip */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                <p className="text-emerald-800">
                  <strong>💡 Tipp:</strong> Planen Sie Ihre Rückfahrt VOR Abfahrt!
                  Nutzen Sie die VBB-App oder fragen Sie am Bahnhof nach den aktuellen Abfahrtszeiten.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Print footer */}
        <div className="mt-8 p-4 bg-slate-100 rounded-xl text-center text-slate-600 hidden print:block print:mt-4">
          <p className="font-medium">ZernsdorfConnect Reiseplanung</p>
          <p className="text-sm">Erstellt am {new Date().toLocaleDateString('de-DE')} • Bitte vor Reiseantritt nochmals prüfen.</p>
        </div>
      </div>
    </div>
  );
}
