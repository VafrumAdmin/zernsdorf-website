'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Bus,
  Train,
  Clock,
  RefreshCw,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ExternalLink,
  Car,
  ArrowRight,
  Timer,
  Calendar,
  Info,
  Settings,
} from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AddressSettings } from '@/components/settings';

// Types
interface TransitDeparture {
  line: string;
  lineName: string;
  direction: string;
  plannedTime: string;
  actualTime: string | null;
  delay: number;
  platform?: string;
  stop: string;
  stopId: string;
  product: 'bus' | 'regional';
}

interface ConnectionCheck {
  targetLine: string;
  targetDirection: string;
  targetTime: Date;
  bufferMinutes: number;
  canReachByCar: boolean;
  canReachByTransit: boolean;
  carTime: number;
  recommendation: 'car' | 'transit' | 'unlikely';
  connectingDeparture?: TransitDeparture;
}

// Line colors
const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  '721': { bg: 'bg-blue-600', text: 'text-white' },
  '723': { bg: 'bg-orange-500', text: 'text-white' },
  'RB36': { bg: 'bg-red-600', text: 'text-white' },
  'RE2': { bg: 'bg-red-700', text: 'text-white' },
  'RE7': { bg: 'bg-red-700', text: 'text-white' },
  'S46': { bg: 'bg-green-600', text: 'text-white' },
  'S8': { bg: 'bg-green-700', text: 'text-white' },
};

function getLineStyle(lineName: string) {
  // Check for S-Bahn
  if (lineName.startsWith('S')) {
    return { bg: 'bg-green-600', text: 'text-white' };
  }
  // Check for RE/RB
  if (lineName.startsWith('R')) {
    return { bg: 'bg-red-600', text: 'text-white' };
  }
  return LINE_COLORS[lineName] || { bg: 'bg-slate-600', text: 'text-white' };
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMinutesUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

function formatMinutesUntil(dateStr: string): string {
  const minutes = getMinutesUntil(dateStr);
  if (minutes <= 0) return 'Jetzt';
  if (minutes === 1) return '1 Min';
  return `${minutes} Min`;
}

function formatDelay(seconds: number): string {
  if (seconds === 0) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes > 0) return `+${minutes}`;
  return `${minutes}`;
}

// Departure Row Component
function DepartureRow({ departure }: { departure: TransitDeparture }) {
  const time = departure.actualTime || departure.plannedTime;
  const minutes = getMinutesUntil(time);
  const lineStyle = getLineStyle(departure.lineName);
  const delayMinutes = Math.round(departure.delay / 60);
  const isDelayed = delayMinutes > 0;
  const isSoon = minutes <= 5;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition ${
      isSoon ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
    }`}>
      {/* Line Badge */}
      <div className={`${lineStyle.bg} ${lineStyle.text} px-2.5 py-1 rounded font-bold text-sm min-w-[50px] text-center`}>
        {departure.lineName}
      </div>

      {/* Direction */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{departure.direction}</p>
        <p className="text-xs text-slate-500">{departure.stop}</p>
      </div>

      {/* Platform */}
      {departure.platform && (
        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
          Gl. {departure.platform}
        </div>
      )}

      {/* Delay */}
      {isDelayed && (
        <div className="text-red-600 text-sm font-medium">
          +{delayMinutes}'
        </div>
      )}

      {/* Time */}
      <div className="text-right">
        <p className={`font-bold ${isSoon ? 'text-amber-600' : 'text-slate-800'}`}>
          {formatMinutesUntil(time)}
        </p>
        <p className="text-xs text-slate-500">{formatTime(time)}</p>
      </div>
    </div>
  );
}

// Departure Board Component
function DepartureBoard({
  title,
  icon,
  departures,
  loading,
  error,
  onRefresh,
  showProduct,
  filterProducts,
}: {
  title: string;
  icon: React.ReactNode;
  departures: TransitDeparture[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  showProduct?: boolean;
  filterProducts?: ('bus' | 'regional')[];
}) {
  const filteredDepartures = filterProducts
    ? departures.filter(d => filterProducts.includes(d.product))
    : departures;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded-lg transition text-white"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {loading && departures.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <RefreshCw className="animate-spin mr-2" size={20} />
            Lade Abfahrten...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="mr-2" size={20} />
            {error}
          </div>
        ) : filteredDepartures.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Keine Abfahrten in den nächsten 60 Minuten
          </div>
        ) : (
          filteredDepartures.slice(0, 8).map((dep, idx) => (
            <DepartureRow key={`${dep.lineName}-${dep.plannedTime}-${idx}`} departure={dep} />
          ))
        )}
      </div>
    </div>
  );
}

// Connection Checker Component
function ConnectionChecker({
  kwDepartures,
  zernsdorfDepartures,
  trafficLevel,
}: {
  kwDepartures: TransitDeparture[];
  zernsdorfDepartures: TransitDeparture[];
  trafficLevel: 'frei' | 'leicht' | 'stockend' | 'stau';
}) {
  const [selectedTarget, setSelectedTarget] = useState<TransitDeparture | null>(null);

  // Filter nur Züge/S-Bahnen für KW
  const trainDepartures = kwDepartures.filter(d => d.product === 'regional').slice(0, 6);

  // Berechne Auto-Fahrzeit basierend auf Verkehrslage
  const carTimes: Record<string, number> = {
    frei: 8,
    leicht: 10,
    stockend: 15,
    stau: 25,
  };
  const carTime = carTimes[trafficLevel] || 10;

  // Berechne Anschlussmöglichkeiten
  const checkConnection = (target: TransitDeparture): ConnectionCheck => {
    const targetTime = new Date(target.actualTime || target.plannedTime);
    const now = new Date();
    const bufferMinutes = Math.round((targetTime.getTime() - now.getTime()) / 60000);

    // Auto: braucht carTime + 5 Min Puffer
    const canReachByCar = bufferMinutes >= carTime + 5;

    // ÖPNV: Suche passende Verbindung
    const requiredArrival = new Date(targetTime.getTime() - 5 * 60000); // 5 Min Umsteigezeit
    const connectingDeparture = zernsdorfDepartures.find(dep => {
      const depTime = new Date(dep.actualTime || dep.plannedTime);
      if (depTime <= now) return false;

      // Geschätzte Fahrzeit: Bus 12 Min, Zug 8 Min
      const travelTime = dep.product === 'regional' ? 8 : 12;
      const arrivalTime = new Date(depTime.getTime() + travelTime * 60000);
      return arrivalTime <= requiredArrival;
    });

    const canReachByTransit = !!connectingDeparture;

    let recommendation: 'car' | 'transit' | 'unlikely' = 'unlikely';
    if (canReachByTransit) recommendation = 'transit';
    else if (canReachByCar) recommendation = 'car';

    return {
      targetLine: target.lineName,
      targetDirection: target.direction,
      targetTime,
      bufferMinutes,
      canReachByCar,
      canReachByTransit,
      carTime,
      recommendation,
      connectingDeparture,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-600 flex items-center gap-2 text-white">
        <Timer size={20} />
        <span className="font-semibold">Schaffe ich den Zug in KW?</span>
      </div>

      <div className="p-4">
        <p className="text-sm text-slate-600 mb-4">
          Wähle einen Zug aus, den du in Königs Wusterhausen erreichen möchtest:
        </p>

        {/* Traffic Status */}
        <div className={`flex items-center gap-2 p-2 rounded-lg mb-4 ${
          trafficLevel === 'frei' ? 'bg-green-50 text-green-700' :
          trafficLevel === 'leicht' ? 'bg-lime-50 text-lime-700' :
          trafficLevel === 'stockend' ? 'bg-amber-50 text-amber-700' :
          'bg-red-50 text-red-700'
        }`}>
          <Car size={16} />
          <span className="text-sm">
            Verkehrslage: <strong>{
              trafficLevel === 'frei' ? 'Frei' :
              trafficLevel === 'leicht' ? 'Leicht' :
              trafficLevel === 'stockend' ? 'Stockend' : 'Stau'
            }</strong> (~{carTime} Min mit Auto nach KW)
          </span>
        </div>

        {/* Target Trains */}
        <div className="space-y-2 mb-4">
          {trainDepartures.map((train, idx) => {
            const connection = checkConnection(train);
            const isSelected = selectedTarget?.plannedTime === train.plannedTime;

            return (
              <button
                key={`${train.lineName}-${train.plannedTime}-${idx}`}
                onClick={() => setSelectedTarget(isSelected ? null : train)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${getLineStyle(train.lineName).bg} ${getLineStyle(train.lineName).text} px-2 py-0.5 rounded text-sm font-bold`}>
                    {train.lineName}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{train.direction}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatTime(train.actualTime || train.plannedTime)}</p>
                    <p className="text-xs text-slate-500">in {connection.bufferMinutes} Min</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    connection.recommendation === 'transit' ? 'bg-green-500' :
                    connection.recommendation === 'car' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Connection Result */}
        {selectedTarget && (
          <div className="border-t border-slate-200 pt-4">
            {(() => {
              const connection = checkConnection(selectedTarget);
              return (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800">
                    Erreichbarkeit: {connection.targetLine} um {formatTime(selectedTarget.actualTime || selectedTarget.plannedTime)}
                  </h4>

                  {/* Car Option */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    connection.canReachByCar ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <Car size={20} className={connection.canReachByCar ? 'text-green-600' : 'text-red-600'} />
                    <div className="flex-1">
                      <p className="font-medium">{connection.canReachByCar ? 'Mit Auto erreichbar' : 'Mit Auto knapp'}</p>
                      <p className="text-sm text-slate-600">~{connection.carTime} Min Fahrzeit + 5 Min Puffer</p>
                    </div>
                    {connection.canReachByCar ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                  </div>

                  {/* Transit Option */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    connection.canReachByTransit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {connection.connectingDeparture?.product === 'regional' ? (
                      <Train size={20} className={connection.canReachByTransit ? 'text-green-600' : 'text-red-600'} />
                    ) : (
                      <Bus size={20} className={connection.canReachByTransit ? 'text-green-600' : 'text-red-600'} />
                    )}
                    <div className="flex-1">
                      {connection.canReachByTransit && connection.connectingDeparture ? (
                        <>
                          <p className="font-medium">Mit {connection.connectingDeparture.lineName} erreichbar</p>
                          <p className="text-sm text-slate-600">
                            Abfahrt {formatTime(connection.connectingDeparture.actualTime || connection.connectingDeparture.plannedTime)} ab {connection.connectingDeparture.stop}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Keine passende ÖPNV-Verbindung</p>
                          <p className="text-sm text-slate-600">Kein Bus/Zug erreicht KW rechtzeitig</p>
                        </>
                      )}
                    </div>
                    {connection.canReachByTransit ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className={`p-4 rounded-lg ${
                    connection.recommendation === 'transit' ? 'bg-green-100 border border-green-300' :
                    connection.recommendation === 'car' ? 'bg-amber-100 border border-amber-300' :
                    'bg-red-100 border border-red-300'
                  }`}>
                    <p className="font-bold text-lg">
                      {connection.recommendation === 'transit' ? '✅ Empfehlung: ÖPNV nehmen' :
                       connection.recommendation === 'car' ? '🚗 Empfehlung: Mit dem Auto fahren' :
                       '⚠️ Zug wahrscheinlich nicht erreichbar'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// Schedule times type
interface ScheduleTimes {
  direction: string;
  times: string[];
}

interface ScheduleData {
  weekday: ScheduleTimes[];
  saturday: ScheduleTimes[];
  sunday: ScheduleTimes[];
}

// Expandable Schedule Component
function ExpandableSchedule({
  title,
  color,
  route,
  stopsToKW,
  stopsFromKW,
  schedule,
  notes,
  icon,
  directionLabels,
}: {
  title: string;
  color: string;
  route: string;
  stopsToKW: string[];
  stopsFromKW: string[];
  schedule?: ScheduleData;
  notes?: string[];
  icon: React.ReactNode;
  directionLabels?: { toKW: string; fromKW: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeDirection, setActiveDirection] = useState<'toKW' | 'fromKW'>('toKW');

  const labels = directionLabels || { toKW: 'Richtung KW Bhf', fromKW: 'Ab KW Bhf' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition"
      >
        <div className={`${color} text-white px-3 py-1.5 rounded font-bold text-sm flex items-center gap-2`}>
          {icon}
          {title}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-slate-700">{route}</p>
        </div>
        <ChevronRight
          size={20}
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {/* Direction Toggle */}
          <div className="mt-3 mb-4 flex gap-2">
            <button
              onClick={() => setActiveDirection('toKW')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                activeDirection === 'toKW'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {labels.toKW}
            </button>
            <button
              onClick={() => setActiveDirection('fromKW')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                activeDirection === 'fromKW'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {labels.fromKW}
            </button>
          </div>

          {/* Stops in order */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Haltestellenfolge
            </h4>
            <div className="flex flex-wrap items-center gap-1">
              {(activeDirection === 'toKW' ? stopsToKW : stopsFromKW).map((stop, idx, arr) => (
                <span key={idx} className="flex items-center">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                    {stop}
                  </span>
                  {idx < arr.length - 1 && (
                    <ArrowRight size={12} className="mx-1 text-slate-400" />
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Times */}
          {schedule && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Abfahrtszeiten</h4>

              {/* Weekday */}
              <div className="mb-3">
                <p className="text-xs font-medium text-blue-700 mb-1 bg-blue-50 px-2 py-1 rounded inline-block">
                  Montag - Freitag
                </p>
                {schedule.weekday.map((sched, idx) => (
                  <div key={idx} className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">{sched.direction}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sched.times.map((time, tidx) => (
                        <span key={tidx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-mono">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Saturday */}
              <div className="mb-3">
                <p className="text-xs font-medium text-amber-700 mb-1 bg-amber-50 px-2 py-1 rounded inline-block">
                  Samstag
                </p>
                {schedule.saturday.map((sched, idx) => (
                  <div key={idx} className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">{sched.direction}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sched.times.length > 0 ? sched.times.map((time, tidx) => (
                        <span key={tidx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-mono">
                          {time}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-500 italic">Kein Betrieb</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sunday */}
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1 bg-purple-50 px-2 py-1 rounded inline-block">
                  Sonn- & Feiertag
                </p>
                {schedule.sunday.map((sched, idx) => (
                  <div key={idx} className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">{sched.direction}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sched.times.length > 0 ? sched.times.map((time, tidx) => (
                        <span key={tidx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-mono">
                          {time}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-500 italic">Kein Betrieb</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && notes.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-600 mb-1">Hinweise</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {notes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Schedule Section Component
function ScheduleSection() {
  // Bus 721 Fahrplan (Zernsdorf Dorfaue als Referenz)
  const schedule721: ScheduleData = {
    weekday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['05:22', '05:52', '06:22', '06:52', '07:22', '07:52', '08:22', '09:22', '10:22', '11:22', '12:22', '13:22', '14:22', '14:52', '15:22', '15:52', '16:22', '16:52', '17:22', '17:52', '18:22', '19:22'],
    }],
    saturday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['07:22', '08:22', '10:22', '12:22', '14:22', '16:22', '18:22'],
    }],
    sunday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['10:22', '12:22', '14:22', '16:22'],
    }],
  };

  // Bus 723 Fahrplan
  const schedule723: ScheduleData = {
    weekday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['05:47', '06:17', '06:47', '07:17', '07:47', '11:17', '13:17', '14:17', '15:17', '16:17', '17:17', '18:17', '19:17'],
    }],
    saturday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['10:17', '12:17', '14:17', '16:17'],
    }],
    sunday: [{
      direction: 'Ab Zernsdorf Dorfaue',
      times: ['10:17', '12:17', '14:17', '16:17'],
    }],
  };

  // RB36 Fahrplan
  const scheduleRB36: ScheduleData = {
    weekday: [{
      direction: 'Ab Zernsdorf Bhf → KW',
      times: ['05:19', '06:19', '07:19', '08:19', '09:19', '10:19', '11:19', '12:19', '13:19', '14:19', '15:19', '16:19', '17:19', '18:19', '19:19', '20:19', '21:19', '22:19'],
    }],
    saturday: [{
      direction: 'Ab Zernsdorf Bhf → KW',
      times: ['06:19', '07:19', '08:19', '09:19', '10:19', '11:19', '12:19', '13:19', '14:19', '15:19', '16:19', '17:19', '18:19', '19:19', '20:19', '21:19', '22:19'],
    }],
    sunday: [{
      direction: 'Ab Zernsdorf Bhf → KW',
      times: ['07:19', '08:19', '09:19', '10:19', '11:19', '12:19', '13:19', '14:19', '15:19', '16:19', '17:19', '18:19', '19:19', '20:19', '21:19', '22:19'],
    }],
  };

  return (
    <div className="space-y-3">
      {/* Bus 721 */}
      <ExpandableSchedule
        title="721"
        color="bg-blue-600"
        icon={<Bus size={14} />}
        route="S Königs Wusterhausen Bhf ↔ Zernsdorf ↔ Kablow-Ziegelei"
        stopsToKW={[
          'Kablow-Zieg. Am Lankensee',
          'Kablow-Zieg. Brücke',
          'Zernsdorf Zeltplatz',
          'Zernsdorf Nordstr.',
          'Zernsdorf Seekorso',
          'Zernsdorf An der Lanke',
          'Zernsdorf Bahnübergang',
          'Zernsdorf Dorfaue',
          'Zernsdorf Strandweg',
          'Zernsdorf Rütgersstr.',
          'Zernsdorf Wustroweg',
          'Neue Mühle Küchenmeisterallee',
          'Neue Mühle Erlenweg',
          'Neue Mühle Fürstenwalder Weg',
          'KW Tiergarten',
          'S KW Bhf',
        ]}
        stopsFromKW={[
          'S KW Bhf',
          'KW Tiergarten',
          'Neue Mühle Fürstenwalder Weg',
          'Neue Mühle Erlenweg',
          'Neue Mühle Küchenmeisterallee',
          'Zernsdorf Wustroweg',
          'Zernsdorf Rütgersstr.',
          'Zernsdorf Strandweg',
          'Zernsdorf Dorfaue',
          'Zernsdorf Bahnübergang',
          'Zernsdorf An der Lanke',
          'Zernsdorf Seekorso',
          'Zernsdorf Nordstr.',
          'Zernsdorf Zeltplatz',
          'Kablow-Zieg. Brücke',
          'Kablow-Zieg. Am Lankensee',
        ]}
        schedule={schedule721}
        notes={[
          'Fahrzeit Zernsdorf Dorfaue → KW Bhf: ca. 12 Min',
          'Fahrzeit Zernsdorf Dorfaue → Kablow-Ziegelei: ca. 8 Min',
          'Pendelt zwischen KW und Kablow-Ziegelei (Hin- und Rückfahrt)',
          'Verdichteter Takt Mo-Fr in Stoßzeiten',
        ]}
      />

      {/* Bus 723 */}
      <ExpandableSchedule
        title="723"
        color="bg-orange-500"
        icon={<Bus size={14} />}
        route="S Königs Wusterhausen Bhf ↔ Zernsdorf ↔ Kablow ↔ Friedersdorf ↔ Kolberg"
        stopsToKW={[
          'Kolberg Dorf',
          'Blossin Brücke',
          'Blossin Dorf',
          'Dolgenbrodt Dorf',
          'Dolgenbrodt Siedlung',
          'Friedersdorf Blossiner Chaussee',
          'Wolzig Seeweg',
          'Wolzig Dorf',
          'Wolzig Gasthaus am See',
          'Friedersdorf Bahnhof',
          'Friedersdorf Bahnhofstr.',
          'Friedersdorf Sparkasse',
          'Friedersdorf Brandenburger Str.',
          'Friedersdorf Gasthaus',
          'Friedersdorf Fleddergraben',
          'Wenzlow',
          'Friedrichshof',
          'Dannenreich',
          'Kablow Dorf',
          'Kablow Neubau',
          'Zernsdorf Friedrich-Engels-Str.',
          'Zernsdorf Dorfaue',
          'Zernsdorf Strandweg',
          'Zernsdorf Rütgersstr.',
          'Zernsdorf Wustroweg',
          'Neue Mühle Küchenmeisterallee',
          'Neue Mühle Erlenweg',
          'Neue Mühle Fürstenwalder Weg',
          'KW Tiergarten',
          'S KW Bhf',
        ]}
        stopsFromKW={[
          'S KW Bhf',
          'KW Tiergarten',
          'Neue Mühle Fürstenwalder Weg',
          'Neue Mühle Erlenweg',
          'Neue Mühle Küchenmeisterallee',
          'Zernsdorf Wustroweg',
          'Zernsdorf Rütgersstr.',
          'Zernsdorf Strandweg',
          'Zernsdorf Dorfaue',
          'Zernsdorf Friedrich-Engels-Str.',
          'Kablow Neubau',
          'Kablow Dorf',
          'Dannenreich',
          'Friedrichshof',
          'Wenzlow',
          'Friedersdorf Fleddergraben',
          'Friedersdorf Gasthaus',
          'Friedersdorf Brandenburger Str.',
          'Friedersdorf Sparkasse',
          'Friedersdorf Bahnhofstr.',
          'Friedersdorf Bahnhof',
          'Wolzig Gasthaus am See',
          'Wolzig Dorf',
          'Wolzig Seeweg',
          'Friedersdorf Blossiner Chaussee',
          'Dolgenbrodt Siedlung',
          'Dolgenbrodt Dorf',
          'Blossin Dorf',
          'Blossin Brücke',
          'Kolberg Dorf',
        ]}
        schedule={schedule723}
        notes={[
          'Fahrzeit KW → Zernsdorf Dorfaue: ca. 15 Min',
          'Fahrzeit KW → Kolberg: ca. 60 Min',
          'Pendelt zwischen KW und Kolberg (Hin- und Rückfahrt)',
          'Fährt über Wolzig und Blossin nach Kolberg',
          'Wochenende: Stark eingeschränkter Betrieb',
        ]}
      />

      {/* RB36 */}
      <ExpandableSchedule
        title="RB36"
        color="bg-red-600"
        icon={<Train size={14} />}
        route="Königs Wusterhausen ↔ Zernsdorf ↔ Kablow ↔ Friedersdorf ↔ Storkow ↔ Beeskow ↔ Frankfurt (Oder)"
        stopsToKW={[
          'Frankfurt (Oder) Bhf',
          'Frankfurt (Oder) Neuberesinchen',
          'Müllrose Bhf',
          'Mixdorf Bhf',
          'Grunow Bhf',
          'Beeskow Schneeberg Bhf',
          'Beeskow Oegeln Bhf',
          'Beeskow Bhf',
          'Buckow (bei Beeskow) Bhf',
          'Lindenberg (Mark) Bhf',
          'Wendisch Rietz Bhf',
          'Storkow Hubertushöhe Bhf',
          'Storkow Bhf',
          'Kummersdorf Bhf',
          'Friedersdorf Bhf',
          'Kablow Bhf',
          'Zernsdorf Bhf',
          'Niederlehme Bhf',
          'S Königs Wusterhausen Bhf',
        ]}
        stopsFromKW={[
          'S Königs Wusterhausen Bhf',
          'Niederlehme Bhf',
          'Zernsdorf Bhf',
          'Kablow Bhf',
          'Friedersdorf Bhf',
          'Kummersdorf Bhf',
          'Storkow Bhf',
          'Storkow Hubertushöhe Bhf',
          'Wendisch Rietz Bhf',
          'Lindenberg (Mark) Bhf',
          'Buckow (bei Beeskow) Bhf',
          'Beeskow Bhf',
          'Beeskow Oegeln Bhf',
          'Beeskow Schneeberg Bhf',
          'Grunow Bhf',
          'Mixdorf Bhf',
          'Müllrose Bhf',
          'Frankfurt (Oder) Neuberesinchen',
          'Frankfurt (Oder) Bhf',
        ]}
        schedule={scheduleRB36}
        notes={[
          'Fahrzeit Zernsdorf → KW: ca. 8 Min',
          'Schnellste Verbindung nach KW',
          'Direkter Anschluss an S46/S8 in KW',
          'Betrieben von der NEB (Niederbarnimer Eisenbahn)',
          'Stündlicher Takt, auch am Wochenende',
        ]}
      />

      {/* S-Bahn S46 in KW */}
      <ExpandableSchedule
        title="S46"
        color="bg-green-600"
        icon={<Train size={14} />}
        route="S Königs Wusterhausen → Berlin Westend"
        stopsToKW={['Berlin Westend → ... → S Königs Wusterhausen (Endstation)']}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Eichwalde',
          'Grünau',
          'Adlershof',
          'Schöneweide',
          'Neukölln',
          'Hermannstraße',
          'Tempelhof',
          'Südkreuz',
          'Schöneberg',
          'Bundesplatz',
          'Heidelberger Platz',
          'Hohenzollerndamm',
          'Halensee',
          'Westkreuz',
          'Messe Nord/ICC',
          'Westend',
        ]}
        schedule={{
          weekday: [{
            direction: 'S46 ab KW → Westend (Mo-Fr)',
            times: [
              '05:01', '05:21', '05:41', '06:01', '06:21', '06:41',
              '07:01', '07:21', '07:41', '08:01', '08:21', '08:41',
              '09:01', '09:21', '09:41', '10:01', '10:21', '10:41',
              '11:01', '11:21', '11:41', '12:01', '12:21', '12:41',
              '13:01', '13:21', '13:41', '14:01', '14:21', '14:41',
              '15:01', '15:21', '15:41', '16:01', '16:21', '16:41',
              '17:01', '17:21', '17:41', '18:01', '18:21', '18:41',
              '19:01', '19:21', '19:41', '20:01', '20:21', '20:41',
              '21:01', '21:21', '21:41', '22:01', '22:21', '22:41',
              '23:01', '23:21', '23:41', '00:01',
            ],
          }],
          saturday: [{
            direction: 'S46 ab KW → Westend (Sa)',
            times: [
              '06:01', '06:21', '06:41', '07:01', '07:21', '07:41',
              '08:01', '08:21', '08:41', '09:01', '09:21', '09:41',
              '10:01', '10:21', '10:41', '11:01', '11:21', '11:41',
              '12:01', '12:21', '12:41', '13:01', '13:21', '13:41',
              '14:01', '14:21', '14:41', '15:01', '15:21', '15:41',
              '16:01', '16:21', '16:41', '17:01', '17:21', '17:41',
              '18:01', '18:21', '18:41', '19:01', '19:21', '19:41',
              '20:01', '20:21', '20:41', '21:01', '21:21', '21:41',
              '22:01', '22:21', '22:41', '23:01', '23:21', '23:41', '00:01',
            ],
          }],
          sunday: [{
            direction: 'S46 ab KW → Westend (So)',
            times: [
              '07:01', '07:21', '07:41', '08:01', '08:21', '08:41',
              '09:01', '09:21', '09:41', '10:01', '10:21', '10:41',
              '11:01', '11:21', '11:41', '12:01', '12:21', '12:41',
              '13:01', '13:21', '13:41', '14:01', '14:21', '14:41',
              '15:01', '15:21', '15:41', '16:01', '16:21', '16:41',
              '17:01', '17:21', '17:41', '18:01', '18:21', '18:41',
              '19:01', '19:21', '19:41', '20:01', '20:21', '20:41',
              '21:01', '21:21', '21:41', '22:01', '22:21', '22:41',
              '23:01', '23:21', '23:41', '00:01',
            ],
          }],
        }}
        notes={[
          'S46: KW → Westend (über Schöneweide, Neukölln, Südkreuz)',
          'Fahrzeit KW → Schöneweide: ca. 20 Min',
          'Fahrzeit KW → Südkreuz: ca. 30 Min',
          'Fahrzeit KW → Westend: ca. 55 Min',
          'Alle 20 Minuten',
        ]}
        directionLabels={{ toKW: 'Nach KW (Endstation)', fromKW: 'Ab KW → Berlin' }}
      />

      {/* S-Bahn S8 in KW */}
      <ExpandableSchedule
        title="S8"
        color="bg-green-700"
        icon={<Train size={14} />}
        route="S Königs Wusterhausen → Berlin → Birkenwerder"
        stopsToKW={['Birkenwerder → ... → S Königs Wusterhausen (Endstation)']}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Eichwalde',
          'Grünau',
          'Adlershof',
          'Schöneweide',
          'Treptower Park',
          'Ostkreuz',
          'Prenzlauer Allee',
          'Bornholmer Straße',
          'Pankow',
          'Pankow-Heinersdorf',
          'Blankenburg',
          'Hohen Neuendorf',
          'Birkenwerder',
        ]}
        schedule={{
          weekday: [{
            direction: 'S8 ab KW → Birkenwerder (Mo-Fr)',
            times: [
              '05:11', '05:31', '05:51', '06:11', '06:31', '06:51',
              '07:11', '07:31', '07:51', '08:11', '08:31', '08:51',
              '09:11', '09:31', '09:51', '10:11', '10:31', '10:51',
              '11:11', '11:31', '11:51', '12:11', '12:31', '12:51',
              '13:11', '13:31', '13:51', '14:11', '14:31', '14:51',
              '15:11', '15:31', '15:51', '16:11', '16:31', '16:51',
              '17:11', '17:31', '17:51', '18:11', '18:31', '18:51',
              '19:11', '19:31', '19:51', '20:11', '20:31', '20:51',
              '21:11', '21:31', '21:51', '22:11', '22:31', '22:51',
              '23:11', '23:31', '23:51', '00:11',
            ],
          }],
          saturday: [{
            direction: 'S8 ab KW → Birkenwerder (Sa)',
            times: [
              '06:11', '06:31', '06:51', '07:11', '07:31', '07:51',
              '08:11', '08:31', '08:51', '09:11', '09:31', '09:51',
              '10:11', '10:31', '10:51', '11:11', '11:31', '11:51',
              '12:11', '12:31', '12:51', '13:11', '13:31', '13:51',
              '14:11', '14:31', '14:51', '15:11', '15:31', '15:51',
              '16:11', '16:31', '16:51', '17:11', '17:31', '17:51',
              '18:11', '18:31', '18:51', '19:11', '19:31', '19:51',
              '20:11', '20:31', '20:51', '21:11', '21:31', '21:51',
              '22:11', '22:31', '22:51', '23:11', '23:31', '23:51', '00:11',
            ],
          }],
          sunday: [{
            direction: 'S8 ab KW → Birkenwerder (So)',
            times: [
              '07:11', '07:31', '07:51', '08:11', '08:31', '08:51',
              '09:11', '09:31', '09:51', '10:11', '10:31', '10:51',
              '11:11', '11:31', '11:51', '12:11', '12:31', '12:51',
              '13:11', '13:31', '13:51', '14:11', '14:31', '14:51',
              '15:11', '15:31', '15:51', '16:11', '16:31', '16:51',
              '17:11', '17:31', '17:51', '18:11', '18:31', '18:51',
              '19:11', '19:31', '19:51', '20:11', '20:31', '20:51',
              '21:11', '21:31', '21:51', '22:11', '22:31', '22:51',
              '23:11', '23:31', '23:51', '00:11',
            ],
          }],
        }}
        notes={[
          'S8: KW → Birkenwerder (über Ostkreuz, Pankow)',
          'Fahrzeit KW → Ostkreuz: ca. 35 Min',
          'Fahrzeit KW → Alexanderplatz: ca. 45 Min',
          'Alle 20 Minuten (versetzt zur S46)',
          'Zusammen mit S46: alle 10 Min Richtung Berlin',
        ]}
        directionLabels={{ toKW: 'Nach KW (Endstation)', fromKW: 'Ab KW → Berlin' }}
      />

      {/* RE2 Richtung Berlin */}
      <ExpandableSchedule
        title="RE2"
        color="bg-yellow-500"
        icon={<Train size={14} />}
        route="Cottbus ↔ Königs Wusterhausen ↔ BER ↔ Berlin Hbf ↔ Nauen ↔ Wismar"
        stopsToKW={[
          'Berlin Hbf',
          'Berlin Ostkreuz',
          'Flughafen BER Terminal 1-2',
          'S Königs Wusterhausen',
          'Lübben (Spreewald)',
          'Lübbenau (Spreewald)',
          'Cottbus Hbf',
        ]}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Flughafen BER Terminal 1-2',
          'Berlin Ostkreuz',
          'Berlin Hbf',
          'Berlin Spandau',
          'Nauen',
          'Wittenberge',
          'Schwerin Hbf',
          'Wismar',
        ]}
        schedule={{
          weekday: [{
            direction: 'RE2 ab KW → Berlin Hbf (Mo-Fr)',
            times: [
              '05:16', '06:16', '07:16', '08:16', '09:16', '10:16',
              '11:16', '12:16', '13:16', '14:16', '15:16', '16:16',
              '17:16', '18:16', '19:16', '20:16', '21:16', '22:16',
            ],
          }, {
            direction: 'RE2 ab KW → Cottbus (Mo-Fr)',
            times: [
              '05:03', '06:03', '07:03', '08:03', '09:03', '10:03',
              '11:03', '12:03', '13:03', '14:03', '15:03', '16:03',
              '17:03', '18:03', '19:03', '20:03', '21:03', '22:03',
            ],
          }],
          saturday: [{
            direction: 'RE2 ab KW → Berlin Hbf (Sa)',
            times: [
              '06:16', '07:16', '08:16', '09:16', '10:16', '11:16',
              '12:16', '13:16', '14:16', '15:16', '16:16', '17:16',
              '18:16', '19:16', '20:16', '21:16', '22:16',
            ],
          }, {
            direction: 'RE2 ab KW → Cottbus (Sa)',
            times: [
              '06:03', '07:03', '08:03', '09:03', '10:03', '11:03',
              '12:03', '13:03', '14:03', '15:03', '16:03', '17:03',
              '18:03', '19:03', '20:03', '21:03', '22:03',
            ],
          }],
          sunday: [{
            direction: 'RE2 ab KW → Berlin Hbf (So)',
            times: [
              '07:16', '08:16', '09:16', '10:16', '11:16', '12:16',
              '13:16', '14:16', '15:16', '16:16', '17:16', '18:16',
              '19:16', '20:16', '21:16', '22:16',
            ],
          }, {
            direction: 'RE2 ab KW → Cottbus (So)',
            times: [
              '07:03', '08:03', '09:03', '10:03', '11:03', '12:03',
              '13:03', '14:03', '15:03', '16:03', '17:03', '18:03',
              '19:03', '20:03', '21:03', '22:03',
            ],
          }],
        }}
        notes={[
          'Schnellste Verbindung nach Berlin Hbf: ca. 30 Min',
          'Hält am Flughafen BER Terminal 1-2',
          'Weiter nach Wismar über Nauen und Wittenberge',
          'Stündlicher Takt, auch am Wochenende',
        ]}
        directionLabels={{ toKW: 'Nach KW (aus Berlin)', fromKW: 'Ab KW → Berlin / Cottbus' }}
      />

      {/* RE7 */}
      <ExpandableSchedule
        title="RE7"
        color="bg-green-700"
        icon={<Train size={14} />}
        route="Senftenberg/Wünsdorf ↔ Königs Wusterhausen ↔ BER ↔ Berlin Hbf ↔ Dessau"
        stopsToKW={[
          'Dessau Hbf',
          'Lutherstadt Wittenberg',
          'Berlin Hbf',
          'Berlin Ostkreuz',
          'Flughafen BER Terminal 1-2',
          'S Königs Wusterhausen',
          'Senftenberg',
        ]}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Flughafen BER Terminal 1-2',
          'Berlin Ostkreuz',
          'Berlin Hbf',
          'Lutherstadt Wittenberg',
          'Dessau Hbf',
        ]}
        schedule={{
          weekday: [{
            direction: 'RE7 ab KW → Berlin Hbf (Mo-Fr)',
            times: [
              '05:47', '06:47', '07:47', '08:47', '09:47', '10:47',
              '11:47', '12:47', '13:47', '14:47', '15:47', '16:47',
              '17:47', '18:47', '19:47', '20:47', '21:47', '22:47',
            ],
          }, {
            direction: 'RE7 ab KW → Senftenberg (Mo-Fr)',
            times: [
              '05:22', '06:22', '07:22', '08:22', '09:22', '10:22',
              '11:22', '12:22', '13:22', '14:22', '15:22', '16:22',
              '17:22', '18:22', '19:22', '20:22', '21:22', '22:22',
            ],
          }],
          saturday: [{
            direction: 'RE7 ab KW → Berlin Hbf (Sa)',
            times: [
              '06:47', '07:47', '08:47', '09:47', '10:47', '11:47',
              '12:47', '13:47', '14:47', '15:47', '16:47', '17:47',
              '18:47', '19:47', '20:47', '21:47', '22:47',
            ],
          }, {
            direction: 'RE7 ab KW → Senftenberg (Sa)',
            times: [
              '06:22', '07:22', '08:22', '09:22', '10:22', '11:22',
              '12:22', '13:22', '14:22', '15:22', '16:22', '17:22',
              '18:22', '19:22', '20:22', '21:22', '22:22',
            ],
          }],
          sunday: [{
            direction: 'RE7 ab KW → Berlin Hbf (So)',
            times: [
              '07:47', '08:47', '09:47', '10:47', '11:47', '12:47',
              '13:47', '14:47', '15:47', '16:47', '17:47', '18:47',
              '19:47', '20:47', '21:47', '22:47',
            ],
          }, {
            direction: 'RE7 ab KW → Senftenberg (So)',
            times: [
              '07:22', '08:22', '09:22', '10:22', '11:22', '12:22',
              '13:22', '14:22', '15:22', '16:22', '17:22', '18:22',
              '19:22', '20:22', '21:22', '22:22',
            ],
          }],
        }}
        notes={[
          'Schnellverbindung nach Berlin Hbf: ca. 30 Min',
          'Hält am Flughafen BER Terminal 1-2',
          'Weiter nach Dessau über Lutherstadt Wittenberg',
          'Stündlicher Takt, versetzt zum RE2',
          'RE2 + RE7 = alle 30 Min Richtung Berlin',
        ]}
        directionLabels={{ toKW: 'Nach KW (aus Berlin)', fromKW: 'Ab KW → Berlin / Senftenberg' }}
      />

      {/* RB22 */}
      <ExpandableSchedule
        title="RB22"
        color="bg-cyan-500"
        icon={<Train size={14} />}
        route="Königs Wusterhausen ↔ Flughafen BER ↔ Potsdam ↔ Griebnitzsee"
        stopsToKW={[
          'S Griebnitzsee',
          'Potsdam Hbf',
          'Michendorf',
          'Saarmund',
          'Genshagener Heide',
          'Flughafen BER Terminal 1-2',
          'S Königs Wusterhausen',
        ]}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Flughafen BER Terminal 1-2',
          'Genshagener Heide',
          'Saarmund',
          'Michendorf',
          'Potsdam Hbf',
          'S Griebnitzsee',
        ]}
        schedule={{
          weekday: [{
            direction: 'RB22 ab KW → Griebnitzsee (Mo-Fr)',
            times: [
              '05:08', '06:08', '07:08', '08:08', '09:08', '10:08',
              '11:08', '12:08', '13:08', '14:08', '15:08', '16:08',
              '17:08', '18:08', '19:08', '20:08', '21:08', '22:08',
            ],
          }],
          saturday: [{
            direction: 'RB22 ab KW → Griebnitzsee (Sa)',
            times: [
              '06:08', '07:08', '08:08', '09:08', '10:08', '11:08',
              '12:08', '13:08', '14:08', '15:08', '16:08', '17:08',
              '18:08', '19:08', '20:08', '21:08', '22:08',
            ],
          }],
          sunday: [{
            direction: 'RB22 ab KW → Griebnitzsee (So)',
            times: [
              '07:08', '08:08', '09:08', '10:08', '11:08', '12:08',
              '13:08', '14:08', '15:08', '16:08', '17:08', '18:08',
              '19:08', '20:08', '21:08', '22:08',
            ],
          }],
        }}
        notes={[
          'Direkte Verbindung nach Potsdam ohne Umstieg',
          'Fahrzeit KW → Flughafen BER: ca. 10 Min',
          'Fahrzeit KW → Potsdam Hbf: ca. 45 Min',
          'Stündlicher Takt',
        ]}
        directionLabels={{ toKW: 'Nach KW (aus Potsdam)', fromKW: 'Ab KW → BER / Potsdam' }}
      />

      {/* RE20 */}
      <ExpandableSchedule
        title="RE20"
        color="bg-red-600"
        icon={<Train size={14} />}
        route="Berlin Hbf ↔ Königs Wusterhausen ↔ Lübbenau (Spreewald)"
        stopsToKW={[
          'Berlin Hbf',
          'Berlin Ostkreuz',
          'Berlin Schönefeld (S)',
          'S Königs Wusterhausen',
          'Bestensee',
          'Märkisch Buchholz',
          'Lübben (Spreewald)',
          'Lübbenau (Spreewald)',
        ]}
        stopsFromKW={[
          'S Königs Wusterhausen',
          'Berlin Schönefeld (S)',
          'Berlin Ostkreuz',
          'Berlin Hbf',
        ]}
        schedule={{
          weekday: [{
            direction: 'RE20 ab KW → Berlin Hbf (Mo-Fr)',
            times: [
              '05:16', '06:16', '07:16', '08:16', '09:16', '10:16',
              '11:16', '12:16', '13:16', '14:16', '15:16', '16:16',
              '17:16', '18:16', '19:16', '20:16', '21:16',
            ],
          }, {
            direction: 'RE20 ab KW → Lübbenau (Mo-Fr)',
            times: [
              '05:43', '06:43', '07:43', '08:43', '09:43', '10:43',
              '11:43', '12:43', '13:43', '14:43', '15:43', '16:43',
              '17:43', '18:43', '19:43', '20:43', '21:43',
            ],
          }],
          saturday: [{
            direction: 'RE20 ab KW → Berlin Hbf (Sa)',
            times: [
              '06:16', '07:16', '08:16', '09:16', '10:16', '11:16',
              '12:16', '13:16', '14:16', '15:16', '16:16', '17:16',
              '18:16', '19:16', '20:16', '21:16',
            ],
          }, {
            direction: 'RE20 ab KW → Lübbenau (Sa)',
            times: [
              '06:43', '07:43', '08:43', '09:43', '10:43', '11:43',
              '12:43', '13:43', '14:43', '15:43', '16:43', '17:43',
              '18:43', '19:43', '20:43', '21:43',
            ],
          }],
          sunday: [{
            direction: 'RE20 ab KW → Berlin Hbf (So)',
            times: [
              '07:16', '08:16', '09:16', '10:16', '11:16', '12:16',
              '13:16', '14:16', '15:16', '16:16', '17:16', '18:16',
              '19:16', '20:16', '21:16',
            ],
          }, {
            direction: 'RE20 ab KW → Lübbenau (So)',
            times: [
              '07:43', '08:43', '09:43', '10:43', '11:43', '12:43',
              '13:43', '14:43', '15:43', '16:43', '17:43', '18:43',
              '19:43', '20:43', '21:43',
            ],
          }],
        }}
        notes={[
          'Schnellste Verbindung nach Berlin Hbf: ca. 30 Min',
          'Direktverbindung in den Spreewald (Lübbenau)',
          'Stündlicher Takt',
        ]}
        directionLabels={{ toKW: 'Nach KW (aus Berlin)', fromKW: 'Ab KW → Berlin / Spreewald' }}
      />
    </div>
  );
}

// Main Page Component
export default function TransportPage() {
  const { preferences, isLoaded: prefsLoaded } = useUserPreferences();
  const [zernsdorfDepartures, setZernsdorfDepartures] = useState<TransitDeparture[]>([]);
  const [userStopDepartures, setUserStopDepartures] = useState<TransitDeparture[]>([]);
  const [kwTrainDepartures, setKwTrainDepartures] = useState<TransitDeparture[]>([]);
  const [kwBusDepartures, setKwBusDepartures] = useState<TransitDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trafficLevel, setTrafficLevel] = useState<'frei' | 'leicht' | 'stockend' | 'stau'>('frei');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Get user's nearest stop
  const userStop = preferences.nearestStop;

  const fetchDepartures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build fetch requests
      const requests: Promise<Response>[] = [
        fetch('/api/transit?stop=bahnhof&limit=20'),
        fetch('/api/transit?stop=kw&products=regional,suburban'),
        fetch('/api/transit?stop=kw&products=bus'),
      ];

      // Add user's stop if different from bahnhof
      const userStopId = userStop?.id;
      if (userStopId && userStopId !== 'bahnhof') {
        requests.push(fetch(`/api/transit?stop=${userStopId}&limit=20`));
      }

      // Add traffic
      requests.push(fetch('/api/traffic').catch(() => new Response(null, { status: 500 })));

      const responses = await Promise.all(requests);

      const [zernsdorfRes, kwTrainRes, kwBusRes, ...rest] = responses;
      const userStopRes = userStopId && userStopId !== 'bahnhof' ? rest[0] : null;
      const trafficRes = userStopId && userStopId !== 'bahnhof' ? rest[1] : rest[0];

      if (zernsdorfRes.ok) {
        const data = await zernsdorfRes.json();
        setZernsdorfDepartures(data.departures || []);
      }

      if (kwTrainRes.ok) {
        const data = await kwTrainRes.json();
        setKwTrainDepartures(data.departures || []);
      }

      if (kwBusRes.ok) {
        const data = await kwBusRes.json();
        setKwBusDepartures(data.departures || []);
      }

      // User's personal stop
      if (userStopRes?.ok) {
        const data = await userStopRes.json();
        setUserStopDepartures(data.departures || []);
      }

      // Get traffic level
      if (trafficRes?.ok) {
        const trafficData = await trafficRes.json();
        if (trafficData.overallLevel) {
          setTrafficLevel(trafficData.overallLevel as 'frei' | 'leicht' | 'stockend' | 'stau');
        }
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError('Fehler beim Laden der Abfahrten');
      console.error('Transit fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userStop?.id]);

  useEffect(() => {
    if (prefsLoaded) {
      fetchDepartures();
    }
  }, [prefsLoaded, fetchDepartures]);

  useEffect(() => {
    if (!prefsLoaded) return;
    const interval = setInterval(fetchDepartures, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDepartures, prefsLoaded]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/" className="hover:text-emerald-600">Startseite</Link>
            <ChevronRight size={14} />
            <span>ÖPNV</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Bus className="text-emerald-600" size={24} />
              </div>
              ÖPNV Zernsdorf & Königs Wusterhausen
            </h1>
            {lastUpdate && (
              <div className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                Aktualisiert: {lastUpdate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-blue-800 font-medium">Live-Daten vom VBB</p>
            <p className="text-blue-700 text-sm">
              Die Abfahrtszeiten werden alle 30 Sekunden aktualisiert und zeigen Echtzeitdaten inkl. Verspätungen.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-blue-100 rounded-lg transition"
            title="Standort-Einstellungen"
          >
            <Settings size={20} className="text-blue-600" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6">
            <AddressSettings
              compact={false}
              showStorageOption={true}
              onSaved={() => {
                setShowSettings(false);
                fetchDepartures();
              }}
            />
          </div>
        )}


        {/* Zernsdorf Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="text-emerald-600" size={20} />
            Abfahrten ab Zernsdorf
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <DepartureBoard
              title="Zug (RB36)"
              icon={<Train size={18} />}
              departures={zernsdorfDepartures}
              loading={loading}
              error={error}
              onRefresh={fetchDepartures}
              filterProducts={['regional']}
            />
            <DepartureBoard
              title={`Bus (721, 723)${userStop && userStop.id !== 'bahnhof' ? ` - ${userStop.name.replace('Zernsdorf, ', '')}` : ''}`}
              icon={<Bus size={18} />}
              departures={userStop && userStop.id !== 'bahnhof' ? userStopDepartures.filter(d => d.product === 'bus') : zernsdorfDepartures.filter(d => d.product === 'bus')}
              loading={loading}
              error={error}
              onRefresh={fetchDepartures}
            />
          </div>
        </section>

        {/* KW Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} />
            Abfahrten ab Königs Wusterhausen
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <DepartureBoard
              title="Zug & S-Bahn"
              icon={<Train size={18} />}
              departures={kwTrainDepartures}
              loading={loading}
              error={error}
              onRefresh={fetchDepartures}
            />
            <DepartureBoard
              title="Bus"
              icon={<Bus size={18} />}
              departures={kwBusDepartures}
              loading={loading}
              error={error}
              onRefresh={fetchDepartures}
            />
          </div>
        </section>

        {/* Connection Checker */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Timer className="text-blue-600" size={20} />
            Anschluss-Rechner
          </h2>
          <ConnectionChecker
            kwDepartures={kwTrainDepartures}
            zernsdorfDepartures={zernsdorfDepartures}
            trafficLevel={trafficLevel}
          />
        </section>

        {/* Schedules */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-slate-600" size={20} />
            Linien & Fahrpläne
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Klicke auf eine Linie, um Haltestellen und Betriebszeiten zu sehen.
          </p>
          <ScheduleSection />
        </section>

        {/* Tips */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Info size={18} />
            Pendler-Tipps für Zernsdorf
          </h3>
          <ul className="text-sm text-emerald-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>RB36:</strong> Schnellste Verbindung nach KW (~8 Min). Fährt stündlich.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Bus 721:</strong> Fährt durch ganz Zernsdorf über Neue Mühle nach KW und weiter bis Kablow-Ziegelei.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Bus 723:</strong> Fährt von KW über Zernsdorf, Kablow, Friedersdorf nach Kolberg und zurück.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Umstieg KW:</strong> S46/S8 Richtung Berlin alle 20 Min. RE2/RE7 für Schnellverbindung zum Hbf.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>Stoßzeiten:</strong> 6:30-8:00 und 16:00-18:00 Uhr - Busse können voller sein.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
