'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Train,
  Bus,
  Clock,
  MapPin,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

interface TransitStop {
  id: string;
  vbbId: string;
  name: string;
  products: { bus: boolean; regional: boolean };
}

interface TransitDeparture {
  lineName: string;
  direction: string;
  plannedTime: string;
  actualTime: string | null;
  delay: number;
  product: 'bus' | 'regional';
  stop: string;
  stopId: string;
  platform?: string;
  cancelled?: boolean;
}

export default function TransitPage() {
  console.log('[TransitPage] Component rendering');

  const [departures, setDepartures] = useState<TransitDeparture[]>([]);
  const [allStops, setAllStops] = useState<TransitStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<string>('bahnhof');
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showStopSelector, setShowStopSelector] = useState(false);

  const fetchDepartures = async (stopId: string = selectedStop) => {
    setIsLoading(true);
    try {
      console.log('[Transit] Fetching departures for stop:', stopId);
      const response = await fetch(`/api/transit?stop=${stopId}&limit=15`);
      const data = await response.json();
      console.log('[Transit] Received data:', data);
      console.log('[Transit] Departures count:', data.departures?.length || 0);
      setDepartures(data.departures || []);
      setAllStops(data.allStops || []);
      setIsLive(data.isLive || false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Transit] Failed to fetch departures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadDepartures = async () => {
      setIsLoading(true);
      try {
        console.log('[Transit] Fetching for stop:', selectedStop);
        const response = await fetch(`/api/transit?stop=${selectedStop}&limit=15`);
        const data = await response.json();
        console.log('[Transit] Got', data.departures?.length, 'departures');
        setDepartures(data.departures || []);
        setAllStops(data.allStops || []);
        setIsLive(data.isLive || false);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('[Transit] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDepartures();
    const interval = setInterval(loadDepartures, 30000);
    return () => clearInterval(interval);
  }, [selectedStop]);

  const handleStopChange = (stopId: string) => {
    setSelectedStop(stopId);
    setShowStopSelector(false);
    fetchDepartures(stopId);
  };

  const currentStop = allStops.find(s => s.id === selectedStop);

  const formatMinutesUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
    if (minutes <= 0) return 'Jetzt';
    if (minutes === 1) return '1 Min';
    if (minutes < 60) return `${minutes} Min`;
    if (minutes < 120) return `1 Std ${minutes - 60} Min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `${hours} Std`;
    return `${hours} Std ${remainingMins} Min`;
  };

  const formatTimeWithDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    if (isTomorrow) return `Morgen ${time}`;
    return date.toLocaleDateString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#050508] py-8 px-4 lg:px-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1 opacity-30" />
        <div className="orb orb-2 opacity-30" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">ÖPNV</span> Abfahrten
          </h1>
          <p className="text-[#71717a]">Bus & Bahn in Zernsdorf</p>
        </motion.div>

        {/* Stop Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6"
        >
          <button
            onClick={() => setShowStopSelector(!showStopSelector)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div className="text-left">
                <div className="font-medium">{currentStop?.name || 'Haltestelle wählen'}</div>
                <div className="text-xs text-[#71717a] flex gap-2">
                  {currentStop?.products.regional && <span className="text-red-400">Bahn</span>}
                  {currentStop?.products.bus && <span className="text-blue-400">Bus</span>}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#71717a] transition-transform ${showStopSelector ? 'rotate-180' : ''}`} />
          </button>

          {showStopSelector && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 max-h-64 overflow-y-auto">
              {allStops.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => handleStopChange(stop.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    stop.id === selectedStop
                      ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span>{stop.name.replace('Zernsdorf, ', '')}</span>
                  <div className="flex gap-2 text-xs">
                    {stop.products.regional && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">Bahn</span>
                    )}
                    {stop.products.bus && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Bus</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-4 text-sm"
        >
          <div className="flex items-center gap-2 text-[#71717a]">
            {isLive ? (
              <>
                <Wifi className="w-4 h-4 text-[#10b981]" />
                <span className="text-[#10b981]">Live-Daten VBB</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Keine Verbindung</span>
              </>
            )}
            {lastUpdated && (
              <span className="text-xs">
                • {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchDepartures()}
            disabled={isLoading}
            className="flex items-center gap-1 text-[#00d4ff] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Departures List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {isLoading && departures.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00d4ff]" />
              <p className="text-[#71717a]">Lade Abfahrten...</p>
            </div>
          ) : departures.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-[#71717a] opacity-50" />
              <p className="text-lg font-medium mb-2">Keine Abfahrten gefunden</p>
              <p className="text-[#71717a] text-sm">
                Aktuell sind keine Verbindungen von dieser Haltestelle verfügbar.
              </p>
            </div>
          ) : (
            departures.map((dep, idx) => {
              const actualTime = dep.actualTime ? new Date(dep.actualTime) : new Date(dep.plannedTime);
              const delayMinutes = Math.round(dep.delay / 60);
              const minutesUntil = formatMinutesUntil(dep.actualTime || dep.plannedTime);
              const isImminent = minutesUntil === 'Jetzt' || (typeof minutesUntil === 'string' && parseInt(minutesUntil) <= 5);

              return (
                <motion.div
                  key={`${dep.lineName}-${dep.plannedTime}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className={`glass-card p-4 ${isImminent ? 'border border-[#00d4ff]/50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Line Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        dep.product === 'regional' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        <div className="text-center">
                          {dep.product === 'regional' ? (
                            <Train className="w-5 h-5 mx-auto text-red-400 mb-0.5" />
                          ) : (
                            <Bus className="w-5 h-5 mx-auto text-blue-400 mb-0.5" />
                          )}
                          <span className={`text-sm font-bold ${
                            dep.product === 'regional' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {dep.lineName}
                          </span>
                        </div>
                      </div>

                      {/* Direction */}
                      <div>
                        <div className="font-medium text-lg">
                          {dep.direction.replace(', Bahnhof', '').replace(' Bhf', '')}
                        </div>
                        <div className="text-sm text-[#71717a] flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTimeWithDate(dep.plannedTime)}
                            {delayMinutes > 0 && (
                              <span className="text-yellow-400 ml-1">
                                → {formatTime(dep.actualTime!)}
                              </span>
                            )}
                          </span>
                          {dep.platform && (
                            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                              Gleis {dep.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Until */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold font-mono ${
                        isImminent ? 'text-[#00d4ff]' : ''
                      }`}>
                        {minutesUntil}
                      </div>
                      {delayMinutes > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <AlertTriangle className="w-3 h-3" />
                          +{delayMinutes} Min
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-[#71717a]"
        >
          <p>Daten werden alle 30 Sekunden aktualisiert</p>
          <p className="mt-1">Quelle: VBB (Verkehrsverbund Berlin-Brandenburg)</p>
        </motion.div>
      </div>
    </div>
  );
}
