'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Car,
  RefreshCw,
  Navigation,
  Gauge,
  Clock,
  Timer,
  AlertTriangle,
  MapPin,
  ChevronRight,
} from 'lucide-react';

// Dynamischer Import für Leaflet (Client-only)
const TrafficMap = dynamic(() => import('./TrafficMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <div className="text-slate-500">Karte wird geladen...</div>
    </div>
  ),
});

interface TrafficSegment {
  id: string;
  name: string;
  level: 'frei' | 'leicht' | 'stockend' | 'stau';
  speed: number;
  freeFlowSpeed: number;
  delay: number;
  distance: number;
  duration: number;
  durationInTraffic: number;
}

interface TrafficData {
  segments: TrafficSegment[];
  overallLevel: string;
  lastUpdated: string;
  isLive: boolean;
}

// Route coordinates for map markers - echte GPS-Koordinaten
const ROUTE_INFO: Record<string, { description: string; icon: string; lat: number; lng: number }> = {
  l30_kw: {
    description: 'Hauptverbindung nach Königs Wusterhausen (Bahnhof, Einkaufszentren)',
    icon: 'K',
    lat: 52.3010, // Königs Wusterhausen
    lng: 13.6280,
  },
  l30_kablow: {
    description: 'Verbindung nach Kablow und weiter Richtung A13',
    icon: 'B',
    lat: 52.2650, // Kablow
    lng: 13.5800,
  },
  a10: {
    description: 'Autobahn A10 zum Schönefelder Kreuz (BER, Berlin)',
    icon: 'A',
    lat: 52.3200, // Schönefelder Kreuz Richtung
    lng: 13.5400,
  },
};

// Zernsdorf Zentrum
const ZERNSDORF_CENTER = { lat: 52.2847, lng: 13.6083 };

function getTrafficStyle(level: string) {
  switch (level) {
    case 'frei':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        dot: 'bg-green-500',
        label: 'Freie Fahrt',
        gradient: 'from-green-500 to-green-600',
      };
    case 'leicht':
      return {
        bg: 'bg-lime-100',
        text: 'text-lime-800',
        border: 'border-lime-300',
        dot: 'bg-lime-500',
        label: 'Leichter Verkehr',
        gradient: 'from-lime-500 to-lime-600',
      };
    case 'stockend':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        label: 'Stockend',
        gradient: 'from-amber-500 to-amber-600',
      };
    case 'stau':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        dot: 'bg-red-500',
        label: 'Stau',
        gradient: 'from-red-500 to-red-600',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-500',
        label: 'Unbekannt',
        gradient: 'from-slate-500 to-slate-600',
      };
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} Min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}:${remainingMins.toString().padStart(2, '0')} Std`;
}

function formatDelay(seconds: number): string {
  if (seconds < 60) return 'Keine Verzögerung';
  const mins = Math.round(seconds / 60);
  return `+${mins} Min`;
}

export function LiveTrafficSection() {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTraffic = useCallback(async () => {
    try {
      const res = await fetch('/api/traffic');
      if (res.ok) {
        const data = await res.json();
        setTraffic(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Traffic fetch error:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTraffic]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTraffic();
  };

  const overallStyle = traffic ? getTrafficStyle(traffic.overallLevel) : getTrafficStyle('frei');
  const selectedSegment = selectedRoute
    ? traffic?.segments.find((s) => s.id === selectedRoute)
    : null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Car className="h-5 w-5 text-emerald-600" />
          Live-Verkehrslage
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Aktualisieren
        </button>
      </div>

      {/* Overall Status */}
      <div
        className={`${overallStyle.bg} ${overallStyle.border} border rounded-xl p-4 mb-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          {traffic?.overallLevel === 'stau' ? (
            <AlertTriangle className={overallStyle.text} size={24} />
          ) : (
            <Car className={overallStyle.text} size={24} />
          )}
          <div>
            <p className={`font-bold ${overallStyle.text}`}>
              Gesamtlage: {overallStyle.label}
            </p>
            <p className="text-sm text-slate-600">
              {traffic?.isLive ? 'Live-Daten' : 'Simulierte Daten'} • Aktualisiert:{' '}
              {lastRefresh.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Navigation size={16} className="text-emerald-600" />
              Verkehrskarte
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-green-500 rounded"></span> Frei
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-amber-500 rounded"></span> Stockend
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-red-500 rounded"></span> Stau
              </span>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative aspect-[16/9] bg-slate-100">
            <TrafficMap
              segments={traffic?.segments || []}
              selectedRoute={selectedRoute}
              onSelectRoute={(id) => setSelectedRoute(selectedRoute === id ? null : id)}
              routeInfo={ROUTE_INFO}
              center={ZERNSDORF_CENTER}
              getTrafficStyle={getTrafficStyle}
            />

            {/* Selected Route Info Overlay */}
            {selectedSegment && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg z-[1000]">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">{selectedSegment.name}</h4>
                    <p className="text-sm text-slate-600">
                      {ROUTE_INFO[selectedSegment.id]?.description}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      getTrafficStyle(selectedSegment.level).bg
                    } ${getTrafficStyle(selectedSegment.level).text}`}
                  >
                    {getTrafficStyle(selectedSegment.level).label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-slate-500">Distanz</p>
                    <p className="font-semibold">{selectedSegment.distance} km</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fahrzeit</p>
                    <p className="font-semibold">{formatDuration(selectedSegment.durationInTraffic)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Geschw.</p>
                    <p className="font-semibold">{selectedSegment.speed} km/h</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Verzögerung</p>
                    <p className={`font-semibold ${selectedSegment.delay > 60 ? 'text-amber-600' : ''}`}>
                      {formatDelay(selectedSegment.delay)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route Quick Select */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-600 mr-2">Route:</span>
              {traffic?.segments.map((segment) => {
                const style = getTrafficStyle(segment.level);
                const isSelected = selectedRoute === segment.id;

                return (
                  <button
                    key={segment.id}
                    onClick={() => setSelectedRoute(isSelected ? null : segment.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? `${style.bg} ${style.text} ${style.border} border`
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                    {segment.name.replace('L30 → ', '').replace(' (Schönefelder Kreuz)', '')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Routes List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            Strecken im Detail
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
                >
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            traffic?.segments.map((segment) => {
              const style = getTrafficStyle(segment.level);
              const isSelected = selectedRoute === segment.id;

              return (
                <button
                  key={segment.id}
                  onClick={() => setSelectedRoute(isSelected ? null : segment.id)}
                  className={`w-full text-left bg-white rounded-xl border transition hover:shadow-md ${
                    isSelected ? `${style.border} border-2 shadow-md` : 'border-slate-200'
                  }`}
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${style.gradient} px-4 py-2 rounded-t-xl flex items-center justify-between`}>
                    <span className="text-white font-semibold text-sm">{segment.name}</span>
                    <span className="text-white/90 text-xs">{style.label}</span>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Navigation size={14} className="text-slate-400" />
                        <span>{segment.distance} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Gauge size={14} className="text-slate-400" />
                        <span>{segment.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span>{formatDuration(segment.durationInTraffic)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer
                          size={14}
                          className={segment.delay > 60 ? 'text-amber-500' : 'text-slate-400'}
                        />
                        <span className={segment.delay > 60 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                          {formatDelay(segment.delay)}
                        </span>
                      </div>
                    </div>

                    {segment.delay > 120 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-amber-600 text-xs">
                        <AlertTriangle size={12} />
                        <span>Verzögerung von {Math.round(segment.delay / 60)} Minuten</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        {ROUTE_INFO[segment.id]?.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}

          {/* Pendler Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
              <Clock size={14} />
              Pendler-Tipps
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Stoßzeiten: 7-9 Uhr und 16-18 Uhr</li>
              <li>• Alternative: S-Bahn ab KW</li>
              <li>• A10 Staugefahr am Schönefelder Kreuz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
