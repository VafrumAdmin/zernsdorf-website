'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/hooks/useTheme';
import {
  Bus,
  Train,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Car,
  Calendar,
  MapPin,
  History,
  Phone,
  Wrench,
  Info,
  ArrowRight,
  Clock,
  Droplets,
  Palette,
  Check,
  AlertCircle,
  Loader2,
  Wind,
  Thermometer,
  Star,
  MessageSquare,
  ClipboardList,
  PawPrint,
  ShieldCheck,
  Trash2,
  Users,
  Plus,
  Mail,
  Globe,
  X,
  ExternalLink,
} from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Types
interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

interface TransitDeparture {
  line: string;
  direction: string;
  time: string;
  delay: number;
  product: 'bus' | 'regional';
}

interface TrafficSegment {
  id: string;
  name: string;
  level: 'frei' | 'leicht' | 'stockend' | 'stau';
  speed: number;
}

interface TrafficStatusLocation {
  id: string;
  name: string;
  name_short: string | null;
  status: string;
  status_level: string;
  message: string | null;
}

interface DirectoryItem {
  id?: string;
  name: string;
  type: string;
  desc: string;
  address: string;
  open: string;
  location: string;
  tel?: string;
  email?: string;
  website?: string;
  whatsapp?: boolean;
  telegram?: boolean;
  signal?: boolean;
  is_featured?: boolean;
  is_recommended?: boolean;
  logo_url?: string;
  images?: string[];
}

interface EventItem {
  id?: string;
  date: string;
  title: string;
  loc: string;
  time: string;
}

interface MenuItem {
  id: string;
  key: string;
  name: string;
  icon: string;
  path: string;
  is_active: boolean;
}

// Keine Fallback-Daten mehr - nur aus Datenbank laden

// Category mapping for DB to display
const categoryTypeMap: Record<string, string> = {
  'gastronomy': 'Gastronomie',
  'health': 'Gesundheit',
  'retail': 'Gewerbe',
  'crafts': 'Handwerk',
  'clubs': 'Vereine',
  'leisure': 'Freizeit',
  'services': 'Dienstleistungen',
  'emergency': 'Notdienste',
};

// Weather Icon Mapping
function getWeatherIcon(icon: string) {
  if (icon.includes('01')) return Sun;
  if (icon.includes('02') || icon.includes('03')) return CloudSun;
  if (icon.includes('04')) return Cloud;
  if (icon.includes('09') || icon.includes('10')) return CloudRain;
  if (icon.includes('13')) return CloudSnow;
  return Cloud;
}

// Traffic Level Styling
function getTrafficStyle(level: string) {
  switch (level) {
    case 'frei':
    case 'green':
    case 'open':
      return { bg: 'bg-green-500/30', text: 'text-green-200', border: 'border-green-500/50', label: 'FREI' };
    case 'leicht':
    case 'yellow':
    case 'restricted':
    case 'construction':
      return { bg: 'bg-yellow-500/30', text: 'text-yellow-200', border: 'border-yellow-500/50', label: 'EINGESCHRÄNKT' };
    case 'stockend':
      return { bg: 'bg-orange-500/30', text: 'text-orange-200', border: 'border-orange-500/50', label: 'STOCKEND' };
    case 'stau':
    case 'red':
    case 'closed':
      return { bg: 'bg-red-500/30', text: 'text-red-200', border: 'border-red-500/50', label: 'GESPERRT' };
    default:
      return { bg: 'bg-slate-500/30', text: 'text-slate-200', border: 'border-slate-500/50', label: 'UNBEKANNT' };
  }
}

export default function HomePage() {
  const { theme: t, currentTheme, setTheme, themes } = useTheme();
  const { preferences, isLoaded: prefsLoaded } = useUserPreferences();
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<DirectoryItem | null>(null);

  // API Data States
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [trainDepartures, setTrainDepartures] = useState<TransitDeparture[]>([]);
  const [busDepartures, setBusDepartures] = useState<TransitDeparture[]>([]);
  const [transitLoading, setTransitLoading] = useState(true);
  const [busStopName, setBusStopName] = useState<string>('');
  const [traffic, setTraffic] = useState<TrafficSegment[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(true);

  // Traffic Status (Ampel-System aus DB)
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatusLocation[]>([]);
  const [trafficStatusLoading, setTrafficStatusLoading] = useState(true);

  // Directory from DB
  const [directory, setDirectory] = useState<DirectoryItem[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directorySource, setDirectorySource] = useState<'database' | 'fallback'>('fallback');

  // Events from DB
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Menu items from DB (for visibility control)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Fetch Directory from DB
  const fetchDirectory = useCallback(async () => {
    try {
      const res = await fetch('/api/businesses');
      const data = await res.json();

      if (data.businesses && data.businesses.length > 0) {
        // Transform DB data to display format
        const transformed: DirectoryItem[] = data.businesses.map((b: {
          id: string;
          name: string;
          category_name: string;
          description: string | null;
          street: string | null;
          house_number: string | null;
          opening_hours_text: string | null;
          location: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          has_whatsapp: boolean | null;
          has_telegram: boolean | null;
          has_signal: boolean | null;
          is_featured: boolean;
          is_recommended: boolean;
          logo_url: string | null;
          images: string[] | null;
        }) => ({
          id: b.id,
          name: b.name,
          type: categoryTypeMap[b.category_name] || b.category_name || 'Sonstiges',
          desc: b.description || '',
          address: [b.street, b.house_number].filter(Boolean).join(' ') || b.location,
          open: b.opening_hours_text || '',
          location: b.location,
          tel: b.phone || undefined,
          email: b.email || undefined,
          website: b.website || undefined,
          whatsapp: b.has_whatsapp || false,
          telegram: b.has_telegram || false,
          signal: b.has_signal || false,
          is_featured: b.is_featured,
          is_recommended: b.is_recommended,
          logo_url: b.logo_url || undefined,
          images: b.images || undefined,
        }));
        setDirectory(transformed);
        setDirectorySource('database');
      } else {
        setDirectory([]);
        setDirectorySource('fallback');
      }
    } catch (error) {
      console.error('Directory fetch error:', error);
      setDirectory([]);
      setDirectorySource('fallback');
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  // Fetch Events from DB
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events/public?limit=5');
      const data = await res.json();

      if (data.events && data.events.length > 0) {
        // Transform DB data to display format
        const transformed: EventItem[] = data.events.map((e: {
          id: string;
          title: string;
          start_date: string;
          start_time: string | null;
          location_name: string | null;
        }) => {
          const date = new Date(e.start_date);
          const day = date.getDate();
          const month = date.toLocaleDateString('de-DE', { month: 'short' });
          return {
            id: e.id,
            date: `${day}. ${month}`,
            title: e.title,
            loc: e.location_name || '',
            time: e.start_time ? e.start_time.slice(0, 5) : '',
          };
        });
        setEvents(transformed);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Events fetch error:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Fetch Traffic Status (Ampel-System)
  const fetchTrafficStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/traffic/status?dashboard=true');
      const data = await res.json();

      if (data.locations && data.locations.length > 0) {
        setTrafficStatus(data.locations);
      }
    } catch (error) {
      console.error('Traffic status fetch error:', error);
    } finally {
      setTrafficStatusLoading(false);
    }
  }, []);

  // Fetch Menu Items (für Sichtbarkeitssteuerung)
  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      if (data.menuItems) {
        setMenuItems(data.menuItems);
      }
    } catch (error) {
      console.error('Menu items fetch error:', error);
    }
  }, []);

  // Helper function to check if menu item is active
  const isMenuItemActive = (key: string): boolean => {
    if (menuItems.length === 0) return true; // Default: show all if no menu data
    const item = menuItems.find(m => m.key === key);
    return item ? item.is_active : true;
  };

  // Fetch Weather Data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather');
        const data = await res.json();
        if (data.weather) {
          setWeather(data.weather);
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Transit Data - Two separate effects to avoid race conditions

  // Effect 1: ALWAYS fetch trains from Bahnhof - runs immediately on mount
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const res = await fetch('/api/transit?stop=bahnhof&limit=15');
        const data = await res.json();

        const trains = (data.departures || [])
          .filter((dep: { product: string }) => dep.product === 'regional')
          .slice(0, 2)
          .map((dep: { lineName: string; direction: string; actualTime: string | null; plannedTime: string; delay: number; product: 'bus' | 'regional' }) => ({
            line: dep.lineName,
            direction: dep.direction,
            time: dep.actualTime || dep.plannedTime,
            delay: Math.round(dep.delay / 60),
            product: dep.product,
          }));
        setTrainDepartures(trains);
      } catch (error) {
        console.error('Train fetch error:', error);
        setTrainDepartures([]);
      }
    };

    fetchTrains();
    const interval = setInterval(fetchTrains, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect 2: Fetch buses - from user's stop if set, otherwise from Bahnhof
  useEffect(() => {
    const userStopId = preferences.nearestStop?.id;
    const userStopName = preferences.nearestStop?.name || '';

    // Update display name
    if (userStopId && userStopId !== 'bahnhof') {
      setBusStopName(userStopName.replace('Zernsdorf, ', ''));
    } else {
      setBusStopName('');
    }

    const fetchBuses = async () => {
      try {
        // Determine which stop to fetch buses from
        const stopToFetch = (userStopId && userStopId !== 'bahnhof') ? userStopId : 'bahnhof';

        const res = await fetch(`/api/transit?stop=${stopToFetch}&limit=10`);
        const data = await res.json();

        const buses = (data.departures || [])
          .filter((dep: { product: string }) => dep.product === 'bus')
          .slice(0, 2)
          .map((dep: { lineName: string; direction: string; actualTime: string | null; plannedTime: string; delay: number; product: 'bus' | 'regional' }) => ({
            line: dep.lineName,
            direction: dep.direction,
            time: dep.actualTime || dep.plannedTime,
            delay: Math.round(dep.delay / 60),
            product: dep.product,
          }));
        setBusDepartures(buses);
      } catch (error) {
        console.error('Bus fetch error:', error);
        setBusDepartures([]);
      } finally {
        setTransitLoading(false);
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 60 * 1000);
    return () => clearInterval(interval);
  }, [preferences.nearestStop?.id, preferences.nearestStop?.name]);

  // Fetch Traffic Data
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const res = await fetch('/api/traffic');
        const data = await res.json();
        if (data.segments) {
          setTraffic(data.segments);
        }
      } catch (error) {
        console.error('Traffic fetch error:', error);
      } finally {
        setTrafficLoading(false);
      }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Directory, Events, Traffic Status, and Menu Items on mount
  useEffect(() => {
    fetchDirectory();
    fetchEvents();
    fetchTrafficStatus();
    fetchMenuItems();
  }, [fetchDirectory, fetchEvents, fetchTrafficStatus, fetchMenuItems]);

  // Helper: Minutes until departure
  const getMinutesUntil = (timeStr: string) => {
    const depTime = new Date(timeStr);
    const now = new Date();
    const diff = Math.round((depTime.getTime() - now.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  const filteredDirectory = activeCategory === 'Alle'
    ? directory
    : directory.filter(item => {
        if (activeCategory === 'Zernsdorf') return item.location === 'Zernsdorf';
        if (activeCategory === 'KW') return item.location === 'Königs Wusterhausen';
        return item.type === activeCategory;
      });

  const WeatherIcon = weather ? getWeatherIcon(weather.icon) : Cloud;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Hero Section with Dashboard */}
      <section id="dashboard" className={`relative ${t.bgDark} pb-20 pt-24 sm:pt-28 lg:pb-28 lg:pt-32 overflow-hidden transition-colors duration-700`}>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Willkommen zuhause.
            </h1>
            <p className={`text-xl ${t.accent} max-w-2xl mx-auto transition-colors duration-500`}>
              Alles über Zernsdorf, Lankensee & Krüpelsee – auf einen Blick.
            </p>
          </div>

          {/* Smart Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
            {/* Weather Card - Klickbar */}
            <Link href="/weather" className="block h-full">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 hover:scale-[1.02] transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>Wetter • Zernsdorf</span>
                  <div className="flex items-center gap-2">
                    {weatherLoading ? (
                      <Loader2 className="animate-spin text-white/50" size={20} />
                    ) : (
                      <WeatherIcon className="text-yellow-300 group-hover:rotate-12 transition duration-500" />
                    )}
                    <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                {weatherLoading ? (
                  <div className="animate-pulse space-y-2 flex-1">
                    <div className="h-10 bg-white/20 rounded w-24"></div>
                    <div className="h-4 bg-white/10 rounded w-32"></div>
                  </div>
                ) : weather ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-bold">{Math.round(weather.temperature)}°C</span>
                      <span className={`text-lg mb-1 ${t.accent} capitalize`}>{weather.description}</span>
                    </div>
                    <div className={`mt-2 text-sm ${t.accent} flex items-center gap-4`}>
                      <span className="flex items-center">
                        <Thermometer size={14} className="mr-1" /> Gefühlt {Math.round(weather.feelsLike)}°C
                      </span>
                    </div>
                    <div className={`mt-2 text-xs ${t.accent} flex items-center gap-3 border-t border-white/10 pt-2`}>
                      <span className="flex items-center">
                        <Wind size={12} className="mr-1" /> {Math.round(weather.windSpeed)} km/h
                      </span>
                      <span className="flex items-center">
                        <Droplets size={12} className="mr-1" /> {weather.humidity}%
                      </span>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/10 text-xs text-white/60 group-hover:text-white/80 transition">
                      14-Tage-Vorhersage & Regenradar →
                    </div>
                  </div>
                ) : (
                  <div className="text-white/50 flex items-center gap-2">
                    <AlertCircle size={16} /> Keine Daten
                  </div>
                )}
              </div>
            </Link>

            {/* Transport Card */}
            <Link href="/transport" className="block h-full">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 hover:scale-[1.02] transition-all cursor-pointer group h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>ÖPNV • Zernsdorf</span>
                  <div className="flex items-center gap-2">
                    <Train className="text-red-300" />
                    <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                {transitLoading ? (
                  <div className="animate-pulse space-y-2 flex-1">
                    <div className="h-8 bg-white/20 rounded w-20"></div>
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                  </div>
                ) : (trainDepartures.length > 0 || busDepartures.length > 0) ? (
                  <div className="flex-1 flex flex-col">
                    {/* Trains from Bahnhof */}
                    {trainDepartures.length > 0 && (
                      <div className="mb-2">
                        <div className={`text-xs ${t.accent} mb-1`}>Bahnhof</div>
                        {trainDepartures.map((dep, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <Train size={12} className="text-red-300" />
                              <span className="font-medium">{dep.line}</span>
                              <span className={`${t.accent} text-xs`}>→ {dep.direction.replace(', Bahnhof', '').replace(' Bhf', '').split(',')[0]}</span>
                            </span>
                            <span className="font-bold">
                              {getMinutesUntil(dep.time)} min
                              {dep.delay > 0 && <span className="text-yellow-300 text-xs ml-1">+{dep.delay}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Buses from user's stop */}
                    {busDepartures.length > 0 && (
                      <div className={`${trainDepartures.length > 0 ? 'border-t border-white/20 pt-2' : ''}`}>
                        <div className={`text-xs ${t.accent} mb-1`}>{busStopName || 'Bahnhof'}</div>
                        {busDepartures.map((dep, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <Bus size={12} className="text-blue-300" />
                              <span className="font-medium">{dep.line}</span>
                              <span className={`${t.accent} text-xs`}>→ {dep.direction.split(',')[0].split(' ')[0]}</span>
                            </span>
                            <span className="font-bold">
                              {getMinutesUntil(dep.time)} min
                              {dep.delay > 0 && <span className="text-yellow-300 text-xs ml-1">+{dep.delay}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-white/10 text-xs text-white/60 group-hover:text-white/80 transition">
                      Fahrpläne, KW & Anschlussrechner →
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="text-white/50 flex items-center gap-2 mb-3">
                      <AlertCircle size={16} /> Keine Abfahrten
                    </div>
                    <div className={`text-xs ${t.accent} space-y-1`}>
                      <div className="flex items-center gap-2">
                        <Train size={12} className="text-red-300" /> RB36 vom Bahnhof
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus size={12} className="text-blue-300" /> 721, 723 {busStopName ? `von ${busStopName}` : 'nach KW'}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/10 text-xs text-white/60 group-hover:text-white/80 transition">
                      Fahrpläne & Abfahrten anzeigen →
                    </div>
                  </div>
                )}
              </div>
            </Link>

            {/* Traffic Card - With Status Lights */}
            {isMenuItemActive('traffic') && (
              <Link href="/traffic" className="block h-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 hover:scale-[1.02] transition-all cursor-pointer group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>Verkehr • Live</span>
                    <div className="flex items-center gap-2">
                      <Car className="text-green-300" />
                      <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Traffic Data from Google Routes API */}
                  <div className="flex-1 flex flex-col">
                    {trafficLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-6 bg-white/20 rounded w-full"></div>
                        <div className="h-6 bg-white/10 rounded w-full"></div>
                      </div>
                    ) : traffic.length > 0 ? (
                      <div className="space-y-1.5">
                        {traffic.slice(0, 4).map((segment) => {
                          const style = getTrafficStyle(segment.level);
                          return (
                            <div key={segment.id} className="flex justify-between items-center">
                              <span className="text-sm truncate mr-2">{segment.name.replace('Zernsdorf → ', '→ ')}</span>
                              <span className={`px-2 py-0.5 ${style.bg} ${style.text} rounded text-xs font-bold border ${style.border} whitespace-nowrap`}>
                                {style.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-white/50 flex items-center gap-2 mb-2">
                          <AlertCircle size={16} /> Keine Live-Daten
                        </div>
                        <div className={`text-xs ${t.accent} space-y-1`}>
                          <div>→ Bahnhof KW</div>
                          <div>→ Schönefelder Kreuz</div>
                          <div>→ Frankfurt (Oder)</div>
                          <div>→ Cottbus</div>
                        </div>
                      </div>
                    )}
                    <div className={`mt-2 text-xs ${t.accent} border-t border-white/10 pt-2`}>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} /> Baustellen & Sperrungen
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/10 text-xs text-white/60 group-hover:text-white/80 transition">
                      Karte, Baustellen & Pendlertipps →
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Quick Access Bar - direkt im Hero */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {isMenuItemActive('forum') && (
                <Link href="/forum" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <MessageSquare size={20} className="text-white mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Forum</span>
                </Link>
              )}
              {isMenuItemActive('bulletin') && (
                <Link href="/bulletin" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <ClipboardList size={20} className="text-amber-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Kleinanzeigen</span>
                </Link>
              )}
              {isMenuItemActive('pets') && (
                <Link href="/pets" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <PawPrint size={20} className="text-rose-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Haustier-SOS</span>
                </Link>
              )}
              {isMenuItemActive('factcheck') && (
                <Link href="/factcheck" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <ShieldCheck size={20} className="text-blue-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Faktencheck</span>
                </Link>
              )}
              {isMenuItemActive('report') && (
                <Link href="/report" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <Trash2 size={20} className="text-orange-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Mängelmelder</span>
                </Link>
              )}
              {isMenuItemActive('listings') && (
                <Link href="/listings" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <Star size={20} className="text-emerald-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Marktplatz</span>
                </Link>
              )}
              {isMenuItemActive('events') && (
                <Link href="/events" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <Calendar size={20} className="text-purple-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Events</span>
                </Link>
              )}
              {isMenuItemActive('waste') && (
                <Link href="/waste" className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                  <Trash2 size={20} className="text-green-300 mb-1" />
                  <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Abfall</span>
                </Link>
              )}
              <button className="group flex flex-col items-center p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition">
                <Phone size={20} className="text-red-300 mb-1" />
                <span className="text-[10px] sm:text-xs text-white/80 group-hover:text-white">Notdienste</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Split: Directory & Events */}
      <section id="directory" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Directory */}
            <div className="lg:w-2/3">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    {activeCategory === 'Zernsdorf' ? 'Zernsdorf' :
                     activeCategory === 'KW' ? 'Königs Wusterhausen' :
                     activeCategory === 'Gastronomie' ? 'Gastronomie' :
                     activeCategory === 'Gesundheit' ? 'Gesundheit & Ärzte' :
                     activeCategory === 'Gewerbe' ? 'Einkaufen & Gewerbe' :
                     activeCategory === 'Handwerk' ? 'Handwerk & Dienstleister' :
                     activeCategory === 'Vereine' ? 'Vereine & Organisationen' :
                     activeCategory === 'Freizeit' ? 'Freizeit & Erholung' :
                     'Verzeichnis'}
                  </h2>
                  {directorySource === 'database' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      Live
                    </span>
                  )}
                  <Link
                    href="/suggest"
                    className={`ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${t.bg} text-white rounded-lg hover:opacity-90 transition-all shadow-sm`}
                  >
                    <Plus size={16} />
                    Eintrag vorschlagen
                  </Link>
                </div>

                {/* Filters */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {['Alle', 'Zernsdorf', 'KW', 'Gastronomie', 'Gesundheit', 'Gewerbe', 'Handwerk', 'Vereine', 'Freizeit'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition ${
                        activeCategory === cat
                          ? `${t.bg} text-white shadow-md`
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {directoryLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
              ) : filteredDirectory.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500">Keine Einträge für diesen Filter gefunden.</p>
                  <button onClick={() => setActiveCategory('Alle')} className={`mt-2 text-sm font-bold ${t.primary}`}>Alle anzeigen</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDirectory.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => setSelectedBusiness(item)}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col h-[200px] text-left group"
                    >
                      <div className="flex-1 min-h-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Logo neben dem Namen */}
                            {item.logo_url && (
                              <img
                                src={item.logo_url}
                                alt={`${item.name} Logo`}
                                className="w-8 h-8 object-contain rounded flex-shrink-0"
                              />
                            )}
                            <h3 className="font-bold text-slate-800 truncate">{item.name}</h3>
                            {item.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            {item.is_recommended && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded flex-shrink-0">EMPFOHLEN</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 bg-slate-50 px-2 py-0.5 rounded flex-shrink-0 ml-2">{item.type}</span>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2">{item.desc}</p>
                      </div>
                      {/* Kontaktinfos - kompakt */}
                      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-sm">
                        {item.tel && (
                          <span className="flex items-center text-slate-600">
                            <Phone size={14} className={`mr-1.5 ${t.primary}`} />
                            <span className="truncate max-w-[100px]">{item.tel}</span>
                          </span>
                        )}
                        {item.email && (
                          <span className="flex items-center text-slate-600">
                            <Mail size={14} className={`mr-1.5 ${t.primary}`} />
                            <span className="truncate max-w-[120px]">{item.email.split('@')[0]}@...</span>
                          </span>
                        )}
                        {item.website && (
                          <span className="flex items-center text-slate-600">
                            <Globe size={14} className={`mr-1.5 ${t.primary}`} />
                            <span className="truncate max-w-[100px]">{item.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                          </span>
                        )}
                        {!item.tel && !item.email && !item.website && (
                          <span className="flex items-center text-slate-400">
                            <MapPin size={14} className="mr-1.5" />
                            {item.address}
                          </span>
                        )}
                      </div>
                      <div className={`mt-2 text-xs ${t.primary} opacity-0 group-hover:opacity-100 transition flex items-center`}>
                        Details anzeigen <ArrowRight size={12} className="ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Events & History Teaser */}
            <div className="lg:w-1/3 space-y-8">
              {/* Event Calendar */}
              <div id="events" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                  <Calendar className={`mr-2 ${t.primary}`} /> Kommende Events
                </h3>
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((evt, idx) => (
                      <div key={evt.id || idx} className="flex group cursor-pointer">
                        <div className={`flex-shrink-0 w-14 h-14 ${t.iconBg} rounded-lg flex flex-col items-center justify-center ${t.primary} group-hover:${t.bg} group-hover:text-white transition`}>
                          <span className="text-xs font-bold uppercase">{evt.date.split('. ')[1]}</span>
                          <span className="text-xl font-bold">{evt.date.split('. ')[0]}</span>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-bold text-slate-800 text-sm">{evt.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                            <MapPin size={10} className="mr-1" /> {evt.loc}
                            {evt.time && <> • {evt.time} Uhr</>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isMenuItemActive('events') && (
                  <Link href="/events">
                    <button className={`w-full mt-5 py-2 text-sm ${t.primary} font-medium border ${t.border} rounded-lg ${t.bgLight} transition hover:shadow-sm`}>
                      Zum vollen Kalender
                    </button>
                  </Link>
                )}
              </div>

              {/* History Teaser */}
              {isMenuItemActive('history') && (
                <div id="history" className={`${t.bgDark} rounded-2xl p-6 text-white relative overflow-hidden transition-colors duration-700`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <History size={100} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 relative z-10">Geschichte entdecken</h3>
                  <p className={`${t.accent} text-sm mb-4 relative z-10`}>
                    Wussten Sie, dass Zernsdorf einst ein Zentrum der Ziegelindustrie war? Entdecken Sie die historische Entwicklung vom Fischerdorf zum Industriestandort.
                  </p>
                  <Link href="/history">
                    <button className="text-sm font-bold flex items-center hover:opacity-80 transition relative z-10">
                      Zeitreise starten <ArrowRight size={16} className="ml-1" />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Theme Picker Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`p-3 ${t.bg} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300`}
            title="Design anpassen"
          >
            <Palette size={24} />
          </button>

          {showThemePicker && (
            <div className="absolute bottom-16 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1">DESIGN WÄHLEN</div>
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => { setTheme(theme.id); setShowThemePicker(false); }}
                  className={`w-full flex items-center px-2 py-2 rounded-lg text-sm hover:bg-slate-50 transition ${currentTheme === theme.id ? 'bg-slate-50 font-medium text-slate-800' : 'text-slate-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full ${theme.bg} mr-2 shadow-sm`} />
                  {theme.name}
                  {currentTheme === theme.id && <Check size={14} className="ml-auto text-slate-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedBusiness(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`${t.bgDark} text-white p-6 rounded-t-2xl relative`}>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                {/* Logo im Modal */}
                {selectedBusiness.logo_url && (
                  <img
                    src={selectedBusiness.logo_url}
                    alt={`${selectedBusiness.name} Logo`}
                    className="w-16 h-16 object-contain rounded-lg bg-white/10 p-1"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedBusiness.is_featured && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                    {selectedBusiness.is_recommended && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">EMPFOHLEN</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{selectedBusiness.name}</h2>
                  <span className={`text-sm ${t.accent}`}>{selectedBusiness.type}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Bildergalerie */}
              {selectedBusiness.images && selectedBusiness.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Bilder</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBusiness.images.slice(0, 6).map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition"
                      >
                        <img
                          src={img}
                          alt={`${selectedBusiness.name} Bild ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Beschreibung */}
              {selectedBusiness.desc && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Beschreibung</h3>
                  <p className="text-slate-700">{selectedBusiness.desc}</p>
                </div>
              )}

              {/* Kontakt */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Kontakt</h3>
                <div className="space-y-3">
                  {/* Telefon mit Messenger-Icons */}
                  {selectedBusiness.tel && (
                    <div className="flex items-center justify-between">
                      <a
                        href={`tel:${selectedBusiness.tel}`}
                        className={`flex items-center gap-3 ${t.primary} hover:underline font-medium`}
                      >
                        <div className={`w-10 h-10 ${t.iconBg} rounded-lg flex items-center justify-center`}>
                          <Phone size={18} className={t.primary} />
                        </div>
                        {selectedBusiness.tel}
                      </a>
                      {/* Messenger Icons */}
                      <div className="flex gap-2">
                        {selectedBusiness.whatsapp && (
                          <a
                            href={`https://wa.me/${selectedBusiness.tel.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition"
                            title="WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        {selectedBusiness.telegram && (
                          <a
                            href={`https://t.me/${selectedBusiness.tel.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition"
                            title="Telegram"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </a>
                        )}
                        {selectedBusiness.signal && (
                          <a
                            href={`https://signal.me/#p/${selectedBusiness.tel.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition"
                            title="Signal"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* E-Mail */}
                  {selectedBusiness.email && (
                    <a
                      href={`mailto:${selectedBusiness.email}`}
                      className={`flex items-center gap-3 ${t.primary} hover:underline font-medium`}
                    >
                      <div className={`w-10 h-10 ${t.iconBg} rounded-lg flex items-center justify-center`}>
                        <Mail size={18} className={t.primary} />
                      </div>
                      {selectedBusiness.email}
                    </a>
                  )}

                  {/* Website */}
                  {selectedBusiness.website && (
                    <a
                      href={selectedBusiness.website.startsWith('http') ? selectedBusiness.website : `https://${selectedBusiness.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 ${t.primary} hover:underline font-medium`}
                    >
                      <div className={`w-10 h-10 ${t.iconBg} rounded-lg flex items-center justify-center`}>
                        <Globe size={18} className={t.primary} />
                      </div>
                      {selectedBusiness.website.replace(/^https?:\/\/(www\.)?/, '')}
                      <ExternalLink size={14} className="opacity-50" />
                    </a>
                  )}
                </div>
              </div>

              {/* Adresse & Öffnungszeiten */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Adresse</h3>
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <div>
                      <p>{selectedBusiness.address}</p>
                      <p>{selectedBusiness.location}</p>
                    </div>
                  </div>
                </div>
                {selectedBusiness.open && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Öffnungszeiten</h3>
                    <div className="flex items-start gap-2 text-slate-700">
                      <Clock size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
                      <p>{selectedBusiness.open}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
              <Link
                href={`/suggest?edit=${selectedBusiness.id}&name=${encodeURIComponent(selectedBusiness.name)}`}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
              >
                <MessageSquare size={16} />
                Änderung vorschlagen
              </Link>
              <button
                onClick={() => setSelectedBusiness(null)}
                className={`px-6 py-2 ${t.bg} text-white rounded-lg hover:opacity-90 transition font-medium`}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
