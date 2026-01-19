'use client';

import { useState, useEffect } from 'react';
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
  Waves,
  AlertCircle,
  Loader2,
  Wind,
  Thermometer,
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

// Beispiel-Daten für das Verzeichnis
const directory = [
  { name: 'Dr. med. Müller', type: 'Gesundheit', desc: 'Allgemeinmedizin', address: 'Karl-Marx-Str. 12', open: '08:00 - 18:00' },
  { name: 'Zernsdorfer Bäckerei', type: 'Gewerbe', desc: 'Frische Brötchen & Kaffee', address: 'Friedensaue 5', open: '06:00 - 17:00' },
  { name: 'Elektro Schmidt', type: 'Handwerk', desc: 'Installationen & Service', address: 'Undinestr. 3', open: 'Nach Termin' },
  { name: 'Zahnarztpraxis See', type: 'Gesundheit', desc: 'Zahnheilkunde', address: 'Zum Langen See 8', open: '09:00 - 18:00' },
  { name: 'Sportverein Zernsdorf', type: 'Vereine', desc: 'Fußball & Tischtennis', address: 'Sportplatzweg 1', open: 'Training: Die/Do' },
  { name: 'Hofladen "Grüner Korb"', type: 'Gewerbe', desc: 'Regionales Gemüse', address: 'Feldweg 2', open: 'Mo, Mi, Fr' },
  { name: 'Heimatverein', type: 'Vereine', desc: 'Pflege der Ortschronik', address: 'Alte Schule', open: 'Mi 16-18 Uhr' },
  { name: 'Bootsverleih Zernsdorf', type: 'Freizeit', desc: 'Kanus & Motorboote', address: 'Am Hafen 1', open: '10:00 - 20:00' },
  { name: 'Badewiese Krüpelsee', type: 'Freizeit', desc: 'Öffentliche Badestelle', address: 'Uferpromenade', open: 'Ganzjährig' },
];

const events = [
  { date: '15. Aug', title: 'Zernsdorfer Sommerfest', loc: 'Bürgerhaus', time: '14:00' },
  { date: '22. Aug', title: 'Feuerwehr Tag der offenen Tür', loc: 'Feuerwache', time: '10:00' },
  { date: '01. Sep', title: 'Angler-Wettbewerb', loc: 'Krüpelsee Nord', time: '06:00' },
];

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
      return { bg: 'bg-green-500/30', text: 'text-green-200', border: 'border-green-500/50', label: 'FREI' };
    case 'leicht':
      return { bg: 'bg-lime-500/30', text: 'text-lime-200', border: 'border-lime-500/50', label: 'LEICHT' };
    case 'stockend':
      return { bg: 'bg-yellow-500/30', text: 'text-yellow-200', border: 'border-yellow-500/50', label: 'STOCKEND' };
    case 'stau':
      return { bg: 'bg-red-500/30', text: 'text-red-200', border: 'border-red-500/50', label: 'STAU' };
    default:
      return { bg: 'bg-slate-500/30', text: 'text-slate-200', border: 'border-slate-500/50', label: '...' };
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
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // Alle 5 Minuten
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
    const interval = setInterval(fetchTraffic, 2 * 60 * 1000); // Alle 2 Minuten
    return () => clearInterval(interval);
  }, []);

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
        if (activeCategory === 'Dorfleben') return ['Vereine', 'Freizeit'].includes(item.type);
        if (activeCategory === 'Gewerbe') return ['Gewerbe', 'Handwerk', 'Gesundheit'].includes(item.type);
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
            {/* Weather Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition cursor-default group">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>Wetter</span>
                {weatherLoading ? (
                  <Loader2 className="animate-spin text-white/50" size={20} />
                ) : (
                  <WeatherIcon className="text-yellow-300 group-hover:rotate-12 transition duration-500" />
                )}
              </div>
              {weatherLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-10 bg-white/20 rounded w-24"></div>
                  <div className="h-4 bg-white/10 rounded w-32"></div>
                </div>
              ) : weather ? (
                <>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold">{Math.round(weather.temperature)}°C</span>
                    <span className={`text-lg mb-1 ${t.accent} capitalize`}>{weather.description}</span>
                  </div>
                  <div className={`mt-3 text-sm ${t.accent} flex items-center gap-4`}>
                    <span className="flex items-center">
                      <Thermometer size={14} className="mr-1" /> Gefühlt {Math.round(weather.feelsLike)}°C
                    </span>
                    <span className="flex items-center">
                      <Wind size={14} className="mr-1" /> {Math.round(weather.windSpeed)} km/h
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-white/50 flex items-center gap-2">
                  <AlertCircle size={16} /> Keine Daten
                </div>
              )}
            </div>

            {/* Transport Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition cursor-default">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>ÖPNV • Zernsdorf</span>
                <Train className="text-red-300" />
              </div>
              {transitLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-white/20 rounded w-20"></div>
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                </div>
              ) : transitDepartures.length > 0 ? (
                <>
                  <div className="flex items-end space-x-2 mb-2">
                    <span className="text-3xl font-bold">{getMinutesUntil(transitDepartures[0].time)}</span>
                    <span className="text-lg font-normal mb-0.5">min</span>
                    <span className={`text-sm mb-1 ${transitDepartures[0].product === 'regional' ? 'text-red-300' : 'text-blue-300'}`}>
                      {transitDepartures[0].line}
                    </span>
                  </div>
                  <div className={`text-sm ${t.accent} mb-3`}>
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
                </>
              ) : (
                <div className="text-white/50 flex items-center gap-2">
                  <AlertCircle size={16} /> Keine Abfahrten
                </div>
              )}
            </div>

            {/* Traffic Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 text-white hover:bg-white/20 transition cursor-default">
              <div className="flex items-center justify-between mb-3">
                <span className={`font-medium text-sm uppercase tracking-wider ${t.accent}`}>Verkehrslage</span>
                <Car className="text-green-300" />
              </div>
              {trafficLoading ? (
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
                <div className="text-white/50 flex items-center gap-2">
                  <AlertCircle size={16} /> Keine Daten
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Tools & Utility */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <Wrench className={`mr-2 ${t.primary}`} /> Nützliche Dienste
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/waste">
              <button className={`w-full p-4 rounded-xl border border-slate-200 hover:${t.border} hover:shadow-md transition flex flex-col items-center justify-center text-center group`}>
                <div className={`w-10 h-10 ${t.iconBg} rounded-full flex items-center justify-center ${t.primary} mb-3 group-hover:${t.bg} group-hover:text-white transition`}>
                  <Calendar size={20} />
                </div>
                <span className="font-semibold text-slate-700">Abfallkalender</span>
                <span className="text-xs text-slate-500 mt-1">Nächste Abholung anzeigen</span>
              </button>
            </Link>
            <button className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:shadow-md transition flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-3 group-hover:bg-red-600 group-hover:text-white transition">
                <Phone size={20} />
              </div>
              <span className="font-semibold text-slate-700">Notdienste</span>
              <span className="text-xs text-slate-500 mt-1">Apotheken & Ärzte</span>
            </button>
            <button className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                <Droplets size={20} />
              </div>
              <span className="font-semibold text-slate-700">Wasserqualität</span>
              <span className="text-xs text-slate-500 mt-1">Krüpelsee: Ausgezeichnet</span>
            </button>
            <button className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-3 group-hover:bg-amber-600 group-hover:text-white transition">
                <Info size={20} />
              </div>
              <span className="font-semibold text-slate-700">Mängelmelder</span>
              <span className="text-xs text-slate-500 mt-1">Lampe defekt?</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Split: Directory & Events */}
      <section id="directory" className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Directory */}
            <div className="lg:w-2/3">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  {activeCategory === 'Dorfleben' ? 'Dorfleben & Vereine' :
                   activeCategory === 'Gewerbe' ? 'Gewerbe & Dienstleister' :
                   'Verzeichnis'}
                </h2>

                {/* Filters */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {['Alle', 'Gesundheit', 'Gewerbe', 'Handwerk', 'Vereine', 'Freizeit'].map(cat => (
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

              {filteredDirectory.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500">Keine Einträge für diesen Filter gefunden.</p>
                  <button onClick={() => setActiveCategory('Alle')} className={`mt-2 text-sm font-bold ${t.primary}`}>Alle anzeigen</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDirectory.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800">{item.name}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 bg-slate-50 px-2 py-0.5 rounded">{item.type}</span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                        <div className="flex items-center"><MapPin size={14} className={`mr-2 ${t.primary} opacity-70`} /> {item.address}</div>
                        <div className="flex items-center"><Clock size={14} className={`mr-2 ${t.primary} opacity-70`} /> {item.open}</div>
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
                <div className="space-y-4">
                  {events.map((evt, idx) => (
                    <div key={idx} className="flex group cursor-pointer">
                      <div className={`flex-shrink-0 w-14 h-14 ${t.iconBg} rounded-lg flex flex-col items-center justify-center ${t.primary} group-hover:${t.bg} group-hover:text-white transition`}>
                        <span className="text-xs font-bold uppercase">{evt.date.split('. ')[1]}</span>
                        <span className="text-xl font-bold">{evt.date.split('. ')[0]}</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="font-bold text-slate-800 text-sm">{evt.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center"><MapPin size={10} className="mr-1" /> {evt.loc} • {evt.time} Uhr</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/events">
                  <button className={`w-full mt-5 py-2 text-sm ${t.primary} font-medium border ${t.border} rounded-lg ${t.bgLight} transition hover:shadow-sm`}>
                    Zum vollen Kalender
                  </button>
                </Link>
              </div>

              {/* History Teaser */}
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
