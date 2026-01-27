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
} from 'lucide-react';

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
  is_featured?: boolean;
  is_recommended?: boolean;
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

// Fallback-Daten für das Verzeichnis (werden verwendet wenn keine DB konfiguriert)
const fallbackDirectory: DirectoryItem[] = [
  // === ZERNSDORF - GASTRONOMIE ===
  { name: 'Zum Bayern', type: 'Gastronomie', desc: 'Deutsche Küche, Schnitzel, Biergarten', address: 'Friedensaue 17a', open: 'Di-So', location: 'Zernsdorf', tel: '03375 498819' },
  { name: 'Ristorante & Café Bel Sapore', type: 'Gastronomie', desc: 'Italienische Küche, Pizza, Pasta', address: 'Friedensaue 11', open: 'Di-So', location: 'Zernsdorf', tel: '03375 585 6034' },
  { name: 'Aurora Fischerei', type: 'Gastronomie', desc: 'Frischer Fisch, Räucherfisch', address: 'Karl-Marx-Straße 28', open: 'Nach Saison', location: 'Zernsdorf' },

  // === ZERNSDORF - VEREINE ===
  { name: 'SV Zernsdorf e.V.', type: 'Vereine', desc: 'Fußball, Frauen- & Jugendmannschaften', address: 'Schillingstraße 49', open: 'Training lt. Plan', location: 'Zernsdorf', tel: '03375 52 66 45' },
  { name: 'ESV Lok Zernsdorf e.V.', type: 'Vereine', desc: 'Eisenbahner-Sportverein', address: 'Senziger Weg 17', open: 'Lt. Vereinsplan', location: 'Zernsdorf' },
  { name: 'Judoteam Lok Zernsdorf 1967 e.V.', type: 'Vereine', desc: 'Judo für alle Altersklassen', address: 'Seestraße 6', open: 'Lt. Trainingsplan', location: 'Zernsdorf', tel: '0172 639 90 40' },
  { name: 'Heimatverein Zernsdorf e.V.', type: 'Vereine', desc: 'Ortschronik & Brauchtumspflege', address: 'Friedrich-Engels-Str.', open: 'Nach Vereinbarung', location: 'Zernsdorf', tel: '03375 29 22 75' },
  { name: 'Freiwillige Feuerwehr Zernsdorf', type: 'Vereine', desc: 'Brandschutz, Jugendfeuerwehr (36 Kinder)', address: 'Karl-Marx-Straße 28', open: 'Nach Dienstplan', location: 'Zernsdorf' },
  { name: 'Männerchor Freie Sänger Zernsdorf', type: 'Vereine', desc: 'Chorgesang, Auftritte', address: 'Clubhaus Askania Kablow', open: 'Di 19-21 Uhr Probe', location: 'Zernsdorf' },
  { name: 'KultiZ e.V.', type: 'Vereine', desc: 'Kultur und Begegnungen in Zernsdorf', address: 'Friedrich-Engels-Str. 25', open: 'Lt. Veranstaltungen', location: 'Zernsdorf', tel: '03375 52 68 52' },
  { name: 'DAFV Ortsgruppe Zernsdorf', type: 'Vereine', desc: 'Anglerverein', address: 'Zernsdorf', open: 'Nach Vereinbarung', location: 'Zernsdorf', tel: '03375 29 20 04' },
  { name: 'Förderverein Grundschule Zernsdorf', type: 'Vereine', desc: 'Unterstützung der Grundschule', address: 'Alte Trift 3', open: 'Nach Vereinbarung', location: 'Zernsdorf', tel: '03375 29 30 53' },
  { name: 'Wasserwanderfreunde Zernsdorf', type: 'Vereine', desc: 'Wassersport & Wandern', address: 'Karl-Marx-Straße 18', open: 'Lt. Vereinsplan', location: 'Zernsdorf' },

  // === ZERNSDORF - GESUNDHEIT ===
  { name: 'Praxis Anja-Kristin Helbig', type: 'Gesundheit', desc: 'Allgemeinmedizin', address: 'Zum Bahnhof 4', open: 'Mo-Fr nach Termin', location: 'Zernsdorf' },
  { name: 'Praxis Ludwig & Dr. Hünig', type: 'Gesundheit', desc: 'Allgemeinmedizin', address: 'Undinestraße 32', open: 'Mo-Fr nach Termin', location: 'Zernsdorf' },
  { name: 'Zahnarztpraxis Else & Wildenhain', type: 'Gesundheit', desc: 'Zahnheilkunde', address: 'Zum Langen Berg 1c', open: 'Mo-Fr nach Termin', location: 'Zernsdorf' },
  { name: 'Zahnarztpraxis Dr. Kuhl', type: 'Gesundheit', desc: 'Zahnheilkunde', address: 'Undinestraße 36', open: 'Mo-Fr nach Termin', location: 'Zernsdorf' },

  // === ZERNSDORF - GEWERBE & EINKAUFEN ===
  { name: 'Aldi Nord', type: 'Gewerbe', desc: 'Discounter', address: 'Karl-Marx-Straße 92', open: 'Mo-Sa 8:00-20:00', location: 'Zernsdorf' },
  { name: 'Netto Marken-Discount', type: 'Gewerbe', desc: 'Discounter', address: 'Karl-Marx-Straße', open: 'Mo-Sa 7:00-21:00', location: 'Zernsdorf' },
  { name: 'Dahlback Bäckerei', type: 'Gewerbe', desc: 'Brot, Brötchen, Kuchen', address: 'Karl-Marx-Straße 6-8', open: 'Mo-Sa', location: 'Zernsdorf' },
  { name: 'Schindlers Kiosk & Postfiliale', type: 'Gewerbe', desc: 'Zeitschriften, Tabak, Postdienste', address: 'Friedensaue 8', open: 'Mo-Sa', location: 'Zernsdorf' },
  { name: 'Getränkemarkt Rössler', type: 'Gewerbe', desc: 'Getränke aller Art', address: 'Hinterkietz', open: 'Mo-Sa', location: 'Zernsdorf' },
  { name: 'Fleischer', type: 'Gewerbe', desc: 'Fleisch & Wurstwaren', address: 'Friedensaue 9', open: 'Mo-Sa', location: 'Zernsdorf' },
  { name: 'NKD', type: 'Gewerbe', desc: 'Textil-Discounter', address: 'Iris-Hahs-Hoffstetter-Str. 1', open: 'Mo-Sa', location: 'Zernsdorf' },

  // === ZERNSDORF - HANDWERK ===
  { name: 'Hairfactory am See', type: 'Handwerk', desc: 'Friseurmeisterin, seit 2019', address: 'Zernsdorf', open: 'Nach Termin', location: 'Zernsdorf' },

  // === ZERNSDORF - FREIZEIT & BILDUNG ===
  { name: 'Jugendfreizeitzentrum Zernsdorf', type: 'Freizeit', desc: 'Jugendclub, Freizeitangebote', address: 'Alte Trift 3', open: 'Lt. Öffnungszeiten', location: 'Zernsdorf', tel: '03375 21 12 14' },
  { name: 'Bürgerhaus Zernsdorf', type: 'Freizeit', desc: 'Veranstaltungen, Versammlungen', address: 'Friedrich-Engels-Str. 35-41', open: 'Lt. Veranstaltungen', location: 'Zernsdorf', tel: '03375 52 37 63' },
  { name: 'Der Bücherturm', type: 'Freizeit', desc: 'Bibliothek im Bürgerhaus', address: 'Friedrich-Engels-Str. 35-41', open: 'Lt. Öffnungszeiten', location: 'Zernsdorf' },
  { name: 'Grundschule Zernsdorf', type: 'Freizeit', desc: 'Grundschule', address: 'Alte Trift 3', open: 'Schulzeiten', location: 'Zernsdorf' },
  { name: 'Kita Zernsdorfer Rübchen', type: 'Freizeit', desc: 'Kindertagesstätte', address: 'Alte Trift 3b', open: 'Mo-Fr', location: 'Zernsdorf' },
  { name: 'Kita Schatzkiste', type: 'Freizeit', desc: 'Kindertagesstätte', address: 'Undinestraße 34', open: 'Mo-Fr', location: 'Zernsdorf' },

  // === KÖNIGS WUSTERHAUSEN ===
  { name: 'Mr. Burns Restaurant & Steakhouse', type: 'Gastronomie', desc: 'Steaks, BBQ, American', address: 'Storkower Straße 36, KW', open: 'Di-So', location: 'Königs Wusterhausen' },
  { name: 'Weinladen Am Kanal', type: 'Gastronomie', desc: 'Bistro, Weine, Mediterran', address: 'Bahnhofstraße 24, KW', open: 'Di-Sa', location: 'Königs Wusterhausen' },
  { name: 'Sender KW Museum', type: 'Freizeit', desc: 'Rundfunkgeschichte erleben', address: 'Funkerberg, KW', open: 'Do-So 10:00-17:00', location: 'Königs Wusterhausen' },
  { name: 'Schloss Königs Wusterhausen', type: 'Freizeit', desc: 'Museum, Führungen', address: 'Schlossplatz, KW', open: 'Di-So 10:00-17:00', location: 'Königs Wusterhausen' },
  { name: 'A10 Center Wildau', type: 'Gewerbe', desc: 'Einkaufszentrum mit 100+ Shops', address: 'Chausseestraße 1, Wildau', open: 'Mo-Sa 10:00-20:00', location: 'Königs Wusterhausen' },
];

const fallbackEvents: EventItem[] = [
  { date: '15. Aug', title: 'Zernsdorfer Sommerfest', loc: 'Bürgerhaus', time: '14:00' },
  { date: '22. Aug', title: 'Feuerwehr Tag der offenen Tür', loc: 'Feuerwache', time: '10:00' },
  { date: '01. Sep', title: 'Angler-Wettbewerb', loc: 'Krüpelsee Nord', time: '06:00' },
];

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
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [showThemePicker, setShowThemePicker] = useState(false);

  // API Data States
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [transitDepartures, setTransitDepartures] = useState<TransitDeparture[]>([]);
  const [transitLoading, setTransitLoading] = useState(true);
  const [traffic, setTraffic] = useState<TrafficSegment[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(true);

  // Traffic Status (Ampel-System aus DB)
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatusLocation[]>([]);
  const [trafficStatusLoading, setTrafficStatusLoading] = useState(true);

  // Directory from DB or fallback
  const [directory, setDirectory] = useState<DirectoryItem[]>(fallbackDirectory);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directorySource, setDirectorySource] = useState<'database' | 'fallback'>('fallback');

  // Events from DB or fallback
  const [events, setEvents] = useState<EventItem[]>(fallbackEvents);
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
          is_featured: boolean;
          is_recommended: boolean;
        }) => ({
          id: b.id,
          name: b.name,
          type: categoryTypeMap[b.category_name] || b.category_name || 'Sonstiges',
          desc: b.description || '',
          address: [b.street, b.house_number].filter(Boolean).join(' ') || b.location,
          open: b.opening_hours_text || '',
          location: b.location,
          tel: b.phone || undefined,
          is_featured: b.is_featured,
          is_recommended: b.is_recommended,
        }));
        setDirectory(transformed);
        setDirectorySource('database');
      } else {
        // Fallback to hardcoded data
        setDirectory(fallbackDirectory);
        setDirectorySource('fallback');
      }
    } catch (error) {
      console.error('Directory fetch error:', error);
      setDirectory(fallbackDirectory);
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
        setEvents(fallbackEvents);
      }
    } catch (error) {
      console.error('Events fetch error:', error);
      setEvents(fallbackEvents);
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

  // Fetch Transit Data
  useEffect(() => {
    const fetchTransit = async () => {
      try {
        const res = await fetch('/api/transit?stop=bahnhof&limit=3');
        const data = await res.json();
        if (data.departures && data.departures.length > 0) {
          const transformed = data.departures.map((dep: { lineName: string; direction: string; actualTime: string | null; plannedTime: string; delay: number; product: 'bus' | 'regional' }) => ({
            line: dep.lineName,
            direction: dep.direction,
            time: dep.actualTime || dep.plannedTime,
            delay: Math.round(dep.delay / 60),
            product: dep.product,
          }));
          setTransitDepartures(transformed);
        }
      } catch (error) {
        console.error('Transit fetch error:', error);
      } finally {
        setTransitLoading(false);
      }
    };
    fetchTransit();
    const interval = setInterval(fetchTransit, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
                  <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>ÖPNV • Bahnhof</span>
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
                ) : transitDepartures.length > 0 ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end space-x-2 mb-1">
                      <span className="text-3xl font-bold">{getMinutesUntil(transitDepartures[0].time)}</span>
                      <span className="text-lg font-normal mb-0.5">min</span>
                      <span className={`text-sm mb-1 ${transitDepartures[0].product === 'regional' ? 'text-red-300' : 'text-blue-300'}`}>
                        {transitDepartures[0].line}
                      </span>
                    </div>
                    <div className={`text-sm ${t.accent} mb-2`}>
                      → {transitDepartures[0].direction.replace(', Bahnhof', '').replace(' Bhf', '')}
                      {transitDepartures[0].delay > 0 && (
                        <span className="text-yellow-300 ml-2">+{transitDepartures[0].delay} Min</span>
                      )}
                    </div>
                    {transitDepartures.length > 1 && (
                      <div className={`text-xs ${t.accent} border-t border-white/20 pt-2 space-y-1`}>
                        {transitDepartures.slice(1, 3).map((dep, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="flex items-center gap-1">
                              {dep.product === 'regional' ? <Train size={12} className="text-red-300" /> : <Bus size={12} className="text-blue-300" />}
                              {dep.line} → {dep.direction.split(',')[0].split(' ')[0]}
                            </span>
                            <span>{getMinutesUntil(dep.time)} min</span>
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
                        <Train size={12} className="text-red-300" /> RB36 Richtung Beeskow/KW
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus size={12} className="text-blue-300" /> 721, 723 nach KW
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

                  {/* Traffic Status Lights from Admin */}
                  <div className="flex-1 flex flex-col">
                    {!trafficStatusLoading && trafficStatus.length > 0 ? (
                      <div className="space-y-2">
                        {trafficStatus.slice(0, 3).map((loc) => {
                          const style = getTrafficStyle(loc.status_level || loc.status);
                          return (
                            <div key={loc.id} className="flex justify-between items-center">
                              <span className="text-sm truncate mr-2">{loc.name_short || loc.name}</span>
                              <span className={`px-2 py-0.5 ${style.bg} ${style.text} rounded text-xs font-bold border ${style.border} whitespace-nowrap`}>
                                {style.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : trafficLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-6 bg-white/20 rounded w-full"></div>
                        <div className="h-6 bg-white/10 rounded w-full"></div>
                      </div>
                    ) : traffic.length > 0 ? (
                      <div className="space-y-2">
                        {traffic.slice(0, 3).map((segment) => {
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
                          <div>→ Richtung Königs Wusterhausen</div>
                          <div>→ Richtung Kablow / A13</div>
                          <div>→ Autobahn A10</div>
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
                    <div key={item.id || idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                            {item.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            {item.is_recommended && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">EMPFOHLEN</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 bg-slate-50 px-2 py-0.5 rounded">{item.type}</span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                        <div className="flex items-center"><MapPin size={14} className={`mr-2 ${t.primary} opacity-70`} /> {item.address}</div>
                        {item.open && <div className="flex items-center"><Clock size={14} className={`mr-2 ${t.primary} opacity-70`} /> {item.open}</div>}
                      </div>
                    </div>
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
    </div>
  );
}
