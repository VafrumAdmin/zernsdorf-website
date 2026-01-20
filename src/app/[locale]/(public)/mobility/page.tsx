'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import {
  Car,
  Train,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Home,
  Briefcase,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
}

interface TrafficInfo {
  duration: number;
  durationInTraffic: number;
  delay: number;
  level: 'frei' | 'leicht' | 'stockend' | 'stau';
}

interface Connection {
  departure: string;
  arrival: string;
  duration: number;
  transfers: number;
  products: string[];
  delay?: number;
  reachable: boolean;
  probability: number;
}

interface TripPlan {
  outbound: Connection[];
  returnTrip: Connection[];
}

// Vordefinierte Ziele in der Region
const POPULAR_DESTINATIONS = [
  { name: 'Berlin Hauptbahnhof', value: 'Berlin Hbf' },
  { name: 'Berlin Alexanderplatz', value: 'Berlin Alexanderplatz' },
  { name: 'Berlin Ostbahnhof', value: 'Berlin Ostbahnhof' },
  { name: 'Königs Wusterhausen Bahnhof', value: 'Königs Wusterhausen' },
  { name: 'Flughafen BER', value: 'Flughafen BER' },
  { name: 'Cottbus Hauptbahnhof', value: 'Cottbus Hbf' },
  { name: 'Frankfurt (Oder)', value: 'Frankfurt (Oder)' },
];

export default function MobilityPage() {
  const { theme: t } = useTheme();

  // Pendler-Modus States
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([
    { id: '1', name: 'Zur Arbeit', from: 'Zernsdorf, Dorfaue', to: 'Berlin Alexanderplatz' },
  ]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Reiseplanung States (Senioren-freundlich)
  const [tripFrom, setTripFrom] = useState('Zernsdorf');
  const [tripTo, setTripTo] = useState('');
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripTime, setTripTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('17:00');
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [showReturnOptions, setShowReturnOptions] = useState(true);

  // Neue Route hinzufügen
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteFrom, setNewRouteFrom] = useState('Zernsdorf');
  const [newRouteTo, setNewRouteTo] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'pendler' | 'reise'>('reise');

  // Simulierte Verbindungsdaten (würde durch VBB API ersetzt)
  const generateMockConnections = (from: string, to: string, startTime: string): Connection[] => {
    const baseTime = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    baseTime.setHours(hours, minutes, 0, 0);

    const connections: Connection[] = [];

    for (let i = 0; i < 5; i++) {
      const depTime = new Date(baseTime.getTime() + i * 30 * 60000);
      const duration = 45 + Math.floor(Math.random() * 30);
      const arrTime = new Date(depTime.getTime() + duration * 60000);
      const delay = Math.random() < 0.3 ? Math.floor(Math.random() * 10) : 0;
      const transfers = Math.floor(Math.random() * 3);

      connections.push({
        departure: depTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        arrival: arrTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        duration,
        transfers,
        products: transfers === 0 ? ['RE', 'S'] : ['RB', 'S', 'U'].slice(0, transfers + 1),
        delay,
        reachable: true,
        probability: delay === 0 ? 95 : Math.max(60, 95 - delay * 5),
      });
    }

    return connections;
  };

  // Verkehrslage für Route laden
  const loadTrafficForRoute = async (route: Route) => {
    setLoadingTraffic(true);
    setSelectedRoute(route);

    try {
      // Simulierte Daten (würde durch Google API ersetzt)
      await new Promise(r => setTimeout(r, 1000));

      const duration = 35 + Math.floor(Math.random() * 20);
      const delay = Math.floor(Math.random() * 15);

      setTrafficInfo({
        duration: duration * 60,
        durationInTraffic: (duration + delay) * 60,
        delay: delay * 60,
        level: delay < 3 ? 'frei' : delay < 8 ? 'leicht' : delay < 12 ? 'stockend' : 'stau',
      });

      // Verbindungen laden
      setLoadingConnections(true);
      const conns = generateMockConnections(route.from, route.to,
        new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      setConnections(conns);
    } catch (error) {
      console.error('Error loading traffic:', error);
    } finally {
      setLoadingTraffic(false);
      setLoadingConnections(false);
    }
  };

  // Reise planen
  const planTrip = async () => {
    if (!tripTo) return;

    setLoadingTrip(true);
    try {
      await new Promise(r => setTimeout(r, 1500));

      const outbound = generateMockConnections(tripFrom, tripTo, tripTime);
      const returnTrip = generateMockConnections(tripTo, tripFrom, returnTime);

      setTripPlan({ outbound, returnTrip });
    } catch (error) {
      console.error('Error planning trip:', error);
    } finally {
      setLoadingTrip(false);
    }
  };

  // Route hinzufügen
  const addRoute = () => {
    if (!newRouteName || !newRouteTo) return;

    setSavedRoutes([...savedRoutes, {
      id: Date.now().toString(),
      name: newRouteName,
      from: newRouteFrom,
      to: newRouteTo,
    }]);

    setShowAddRoute(false);
    setNewRouteName('');
    setNewRouteTo('');
  };

  // Traffic Level Styling
  const getTrafficStyle = (level: string) => {
    switch (level) {
      case 'frei': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Freie Fahrt' };
      case 'leicht': return { bg: 'bg-lime-100', text: 'text-lime-700', label: 'Leichter Verkehr' };
      case 'stockend': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Stockend' };
      case 'stau': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Stau' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Unbekannt' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Mobilität & Reiseplanung</h1>
          <p className="text-slate-600">Verkehrslage, Verbindungen und Reiseplanung für Zernsdorf</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('reise')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'reise'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Train size={20} />
            Reise planen
          </button>
          <button
            onClick={() => setActiveTab('pendler')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'pendler'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase size={20} />
            Meine Routen
          </button>
        </div>

        {/* ==================== REISEPLANUNG (Senioren-freundlich) ==================== */}
        {activeTab === 'reise' && (
          <div className="space-y-6">
            {/* Eingabeformular */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className={t.primary} />
                Wohin möchten Sie fahren?
              </h2>

              <div className="space-y-4">
                {/* Von */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Von</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={tripFrom}
                      onChange={(e) => setTripFrom(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ihr Startort"
                    />
                  </div>
                </div>

                {/* Nach */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nach</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={tripTo}
                      onChange={(e) => setTripTo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ihr Ziel eingeben"
                      list="destinations"
                    />
                    <datalist id="destinations">
                      {POPULAR_DESTINATIONS.map((dest) => (
                        <option key={dest.value} value={dest.value}>{dest.name}</option>
                      ))}
                    </datalist>
                  </div>

                  {/* Schnellauswahl beliebte Ziele */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {POPULAR_DESTINATIONS.slice(0, 4).map((dest) => (
                      <button
                        key={dest.value}
                        onClick={() => setTripTo(dest.value)}
                        className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
                      >
                        {dest.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Datum und Uhrzeit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="date"
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Abfahrt um</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="time"
                        value={tripTime}
                        onChange={(e) => setTripTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rückfahrt */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setShowReturnOptions(!showReturnOptions)}
                    className="flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <ArrowLeftRight size={20} className={t.primary} />
                    Rückfahrt planen
                    {showReturnOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showReturnOptions && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rückfahrt ab</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suchen Button */}
                <button
                  onClick={planTrip}
                  disabled={!tripTo || loadingTrip}
                  className={`w-full py-4 ${t.bg} text-white text-lg font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loadingTrip ? (
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

            {/* Ergebnisse */}
            {tripPlan && (
              <div className="space-y-6">
                {/* Hinfahrt */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ArrowRight className={t.primary} />
                    Hinfahrt: {tripFrom} → {tripTo}
                  </h3>

                  <div className="space-y-3">
                    {tripPlan.outbound.map((conn, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer hover:shadow-md ${
                          idx === 0 ? `border-teal-500 ${t.bgLight}` : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-800">{conn.departure}</div>
                              <div className="text-sm text-slate-500">Abfahrt</div>
                            </div>
                            <ArrowRight className="text-slate-400" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-slate-800">{conn.arrival}</div>
                              <div className="text-sm text-slate-500">Ankunft</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-700">{conn.duration} Min</div>
                            <div className="text-sm text-slate-500">
                              {conn.transfers === 0 ? 'Direkt' : `${conn.transfers}x Umsteigen`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                          <div className="flex gap-2">
                            {conn.products.map((p, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-200 rounded text-xs font-medium">
                                {p}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {conn.delay && conn.delay > 0 ? (
                              <span className="text-yellow-600 text-sm flex items-center gap-1">
                                <AlertTriangle size={14} />
                                +{conn.delay} Min
                              </span>
                            ) : (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle size={14} />
                                Pünktlich
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              conn.probability >= 90 ? 'bg-green-100 text-green-700' :
                              conn.probability >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {conn.probability}% sicher
                            </span>
                          </div>
                        </div>

                        {idx === 0 && (
                          <div className="mt-2 text-sm text-teal-600 font-medium">
                            ★ Empfohlene Verbindung
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rückfahrt */}
                {showReturnOptions && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Home className={t.primary} />
                      Rückfahrt: {tripTo} → {tripFrom}
                    </h3>

                    <div className="space-y-3">
                      {tripPlan.returnTrip.map((conn, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-2 transition cursor-pointer hover:shadow-md ${
                            idx === 0 ? `border-teal-500 ${t.bgLight}` : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-slate-800">{conn.departure}</div>
                                <div className="text-sm text-slate-500">Abfahrt</div>
                              </div>
                              <ArrowRight className="text-slate-400" />
                              <div className="text-center">
                                <div className="text-2xl font-bold text-slate-800">{conn.arrival}</div>
                                <div className="text-sm text-slate-500">Ankunft</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg font-semibold text-slate-700">{conn.duration} Min</div>
                              <div className="text-sm text-slate-500">
                                {conn.transfers === 0 ? 'Direkt' : `${conn.transfers}x Umsteigen`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== PENDLER-MODUS ==================== */}
        {activeTab === 'pendler' && (
          <div className="space-y-6">
            {/* Gespeicherte Routen */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Meine Routen</h2>
                <button
                  onClick={() => setShowAddRoute(!showAddRoute)}
                  className={`p-2 rounded-lg ${t.bgLight} ${t.primary} hover:opacity-80 transition`}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Neue Route hinzufügen */}
              {showAddRoute && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
                  <input
                    type="text"
                    placeholder="Name der Route (z.B. Zur Arbeit)"
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Von"
                      value={newRouteFrom}
                      onChange={(e) => setNewRouteFrom(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Nach"
                      value={newRouteTo}
                      onChange={(e) => setNewRouteTo(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={addRoute}
                    className={`w-full py-2 ${t.bg} text-white rounded-lg font-medium`}
                  >
                    Route speichern
                  </button>
                </div>
              )}

              {/* Routen Liste */}
              <div className="space-y-3">
                {savedRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => loadTrafficForRoute(route)}
                    className={`w-full p-4 rounded-xl border-2 transition text-left hover:shadow-md ${
                      selectedRoute?.id === route.id
                        ? `border-teal-500 ${t.bgLight}`
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.bgLight}`}>
                        {route.name.includes('Arbeit') ? (
                          <Briefcase className={t.primary} size={20} />
                        ) : (
                          <MapPin className={t.primary} size={20} />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{route.name}</div>
                        <div className="text-sm text-slate-500">{route.from} → {route.to}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Verkehrsinfo für ausgewählte Route */}
            {selectedRoute && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{selectedRoute.name}</h3>
                  <button
                    onClick={() => loadTrafficForRoute(selectedRoute)}
                    className="p-2 text-slate-500 hover:text-slate-700 transition"
                  >
                    <RefreshCw size={18} className={loadingTraffic ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingTraffic ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                  </div>
                ) : trafficInfo && (
                  <div className="space-y-4">
                    {/* Verkehrslage */}
                    <div className="flex items-center gap-4">
                      <Car className={t.primary} size={24} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Mit dem Auto</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrafficStyle(trafficInfo.level).bg} ${getTrafficStyle(trafficInfo.level).text}`}>
                            {getTrafficStyle(trafficInfo.level).label}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          {Math.round(trafficInfo.durationInTraffic / 60)} Minuten
                          {trafficInfo.delay > 60 && (
                            <span className="text-yellow-600 ml-2">
                              (+{Math.round(trafficInfo.delay / 60)} Min Verzögerung)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ÖPNV Verbindungen */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Train className={t.primary} size={20} />
                        <span className="font-medium text-slate-700">Nächste Verbindungen</span>
                      </div>

                      {loadingConnections ? (
                        <div className="text-center py-4 text-slate-500">Lade Verbindungen...</div>
                      ) : (
                        <div className="space-y-2">
                          {connections.slice(0, 3).map((conn, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-800">{conn.departure}</span>
                                <ArrowRight size={16} className="text-slate-400" />
                                <span className="font-mono text-slate-600">{conn.arrival}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  conn.probability >= 90 ? 'bg-green-100 text-green-700' :
                                  conn.probability >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {conn.probability}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Empfehlung */}
                    <div className={`p-4 rounded-xl ${t.bgLight} border ${t.border}`}>
                      <div className="flex items-start gap-3">
                        <CheckCircle className={t.primary} size={20} />
                        <div>
                          <div className={`font-semibold ${t.primary}`}>Empfehlung</div>
                          <div className="text-sm text-slate-600 mt-1">
                            {trafficInfo.level === 'frei' || trafficInfo.level === 'leicht'
                              ? 'Guter Zeitpunkt zum Losfahren! Verkehr ist flüssig.'
                              : 'Nutzen Sie lieber den ÖPNV - auf der Straße ist es gerade voll.'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
