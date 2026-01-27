'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/hooks/useTheme';
import {
  ArrowLeft,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  MapPin,
  Umbrella,
  CloudFog,
  Leaf,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  WeatherData,
  HourlyForecast,
  DailyForecast,
  AirQualityData,
  PollenData,
  getAqiLabel,
  getWindDirection,
  getPollenLevel,
  getUVIndexLevel,
} from '@/lib/weather';

// Weather Icon Mapping - unterscheidet Tag (d) und Nacht (n)
function getWeatherIcon(icon: string, size: number = 24) {
  const iconClass = "transition-all";
  const isNight = icon.endsWith('n');

  // 01 = Klar - Tag: Sonne, Nacht: Mond (graue Wolke als Platzhalter)
  if (icon.includes('01')) {
    if (isNight) return <Cloud size={size} className={`text-slate-300 ${iconClass}`} />;
    return <Sun size={size} className={`text-yellow-400 ${iconClass}`} />;
  }
  // 02 = Teilweise bewölkt - Tag: Sonne+Wolke, Nacht: nur Wolke
  if (icon.includes('02')) {
    if (isNight) return <Cloud size={size} className={`text-slate-400 ${iconClass}`} />;
    return <CloudSun size={size} className={`text-amber-400 ${iconClass}`} />;
  }
  // 03 = Leicht bewölkt
  if (icon.includes('03')) return <Cloud size={size} className={`text-slate-400 ${iconClass}`} />;
  // 04 = Bewölkt
  if (icon.includes('04')) return <Cloud size={size} className={`text-slate-500 ${iconClass}`} />;
  // 09 = Nieselregen, 10 = Regen
  if (icon.includes('09') || icon.includes('10')) return <CloudRain size={size} className={`text-blue-400 ${iconClass}`} />;
  // 11 = Gewitter
  if (icon.includes('11')) return <CloudLightning size={size} className={`text-purple-400 ${iconClass}`} />;
  // 13 = Schnee
  if (icon.includes('13')) return <CloudSnow size={size} className={`text-sky-300 ${iconClass}`} />;
  // 50 = Nebel
  if (icon.includes('50')) return <CloudFog size={size} className={`text-slate-400 ${iconClass}`} />;
  return <Cloud size={size} className={`text-slate-400 ${iconClass}`} />;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Heute';
  if (date.toDateString() === tomorrow.toDateString()) return 'Morgen';

  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatHour(dateStr: string) {
  const hour = new Date(dateStr).getHours();
  return `${hour} Uhr`;
}

export default function WeatherPage() {
  const { theme: t } = useTheme();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [pollen, setPollen] = useState<PollenData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'hourly' | '1day' | '3days' | '7days' | '14days'>('hourly');
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      const res = await fetch('/api/weather/forecast');
      const data = await res.json();

      setCurrent(data.current);
      setHourly(data.hourly || []);
      setDaily(data.daily || []);
      setAirQuality(data.airQuality);
      setPollen(data.pollen);
      setIsLive(data.isLive);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  const aqiInfo = airQuality ? getAqiLabel(airQuality.aqi) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section with Current Weather */}
      <section className={`relative ${t.bgDark} pt-20 pb-12 overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition">
            <ArrowLeft size={20} />
            <span>Zurück zur Startseite</span>
          </Link>

          {/* Location & Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white">
              <MapPin size={18} className={t.accent} />
              <span className="text-lg font-medium">Zernsdorf</span>
              {isLive && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live von Open-Meteo
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-white/50 text-sm">
                  {new Date(lastUpdated).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </span>
              )}
              <button
                onClick={() => {
                  setLoading(true);
                  fetchWeatherData();
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white text-sm transition flex items-center gap-2"
              >
                <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Current Weather Card */}
          {current && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Temperature */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-end gap-4">
                      <span className="text-7xl font-bold">{Math.round(current.temperature)}°</span>
                      {getWeatherIcon(current.icon, 64)}
                    </div>
                    <p className="text-2xl text-white/80 mt-2 capitalize">{current.description}</p>
                    <p className={`${t.accent} mt-1`}>
                      Gefühlt wie {Math.round(current.feelsLike)}°C
                    </p>
                  </div>

                  <div className="text-right space-y-3">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp size={16} className="text-red-300" />
                      <span>{daily[0]?.temperatureMax ? Math.round(daily[0].temperatureMax) : '--'}°</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <TrendingDown size={16} className="text-blue-300" />
                      <span>{daily[0]?.temperatureMin ? Math.round(daily[0].temperatureMin) : '--'}°</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-3">
                    <Wind size={20} className="text-white/60" />
                    <div>
                      <p className="text-white/60 text-xs">Wind</p>
                      <p className="font-medium">{Math.round(current.windSpeed)} km/h {getWindDirection(current.windDirection)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Droplets size={20} className="text-white/60" />
                    <div>
                      <p className="text-white/60 text-xs">Luftfeuchtigkeit</p>
                      <p className="font-medium">{current.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge size={20} className="text-white/60" />
                    <div>
                      <p className="text-white/60 text-xs">Luftdruck</p>
                      <p className="font-medium">{Math.round(current.pressure)} hPa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Cloud size={20} className="text-white/60" />
                    <div>
                      <p className="text-white/60 text-xs">Bewölkung</p>
                      <p className="font-medium">{current.clouds}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sun Times & Air Quality */}
              <div className="space-y-4">
                {/* Sunrise/Sunset */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 text-white">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Sun size={18} className="text-yellow-300" />
                    Sonnenzeiten
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sunrise size={18} className="text-orange-300" />
                        <span className="text-white/70">Sonnenaufgang</span>
                      </div>
                      <span className="font-medium">
                        {current.sunrise ? new Date(current.sunrise).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sunset size={18} className="text-orange-400" />
                        <span className="text-white/70">Sonnenuntergang</span>
                      </div>
                      <span className="font-medium">
                        {current.sunset ? new Date(current.sunset).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Air Quality */}
                {airQuality && aqiInfo && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 text-white">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Leaf size={18} className="text-green-300" />
                      Luftqualität
                    </h3>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: aqiInfo.color + '30', color: aqiInfo.color }}
                      >
                        {airQuality.aqi}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: aqiInfo.color }}>{aqiInfo.label}</p>
                        <p className="text-xs text-white/60">PM2.5: {airQuality.pm2_5} µg/m³</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Forecast Tabs */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === 'hourly'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            Stündlich
          </button>
          <button
            onClick={() => setActiveTab('1day')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === '1day'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Heute
          </button>
          <button
            onClick={() => setActiveTab('3days')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === '3days'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            3 Tage
          </button>
          <button
            onClick={() => setActiveTab('7days')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === '7days'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            7 Tage
          </button>
          <button
            onClick={() => setActiveTab('14days')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === '14days'
                ? `${t.bg} text-white`
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            14 Tage
          </button>
        </div>

        {/* Hourly Forecast */}
        {activeTab === 'hourly' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">Stündliche Vorhersage</h2>
              <p className="text-sm text-slate-500">Die nächsten 48 Stunden</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex p-4 gap-4 min-w-max">
                {hourly.slice(0, 48).map((hour, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center min-w-[70px] p-3 rounded-xl hover:bg-slate-50 transition"
                  >
                    <span className="text-sm text-slate-500">{formatHour(hour.time)}</span>
                    <div className="my-2">{getWeatherIcon(hour.icon, 28)}</div>
                    <span className="font-bold text-slate-800">{Math.round(hour.temperature)}°</span>
                    {hour.precipitationProbability > 0 && (
                      <span className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Umbrella size={10} />
                        {hour.precipitationProbability}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1 Day / Today Forecast */}
        {activeTab === '1day' && daily[0] && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">Heute - {formatDate(daily[0].date)}</h2>
              <p className="text-sm text-slate-500">Detaillierte Tagesübersicht</p>
            </div>

            {/* Day Overview */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(daily[0].icon, 64)}
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{daily[0].description}</p>
                    <p className="text-slate-500">
                      <span className="text-red-500 font-medium">{Math.round(daily[0].temperatureMax)}°</span>
                      {' / '}
                      <span className="text-blue-500">{Math.round(daily[0].temperatureMin)}°</span>
                    </p>
                  </div>
                </div>
                {daily[0].precipitationProbability > 0 && (
                  <div className="text-right">
                    <p className="text-blue-500 font-bold text-xl flex items-center gap-2">
                      <Umbrella size={20} />
                      {daily[0].precipitationProbability}%
                    </p>
                    <p className="text-sm text-slate-500">{daily[0].precipitation} mm</p>
                  </div>
                )}
              </div>

              {/* Hourly breakdown for today */}
              <h3 className="font-medium text-slate-700 mb-3">Stundenverlauf</h3>
              <div className="overflow-x-auto -mx-6 px-6">
                <div className="flex gap-3 min-w-max pb-2">
                  {hourly.slice(0, 24).map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center min-w-[60px] p-2 rounded-lg bg-slate-50"
                    >
                      <span className="text-xs text-slate-500">{formatHour(hour.time)}</span>
                      <div className="my-1">{getWeatherIcon(hour.icon, 24)}</div>
                      <span className="font-bold text-slate-800 text-sm">{Math.round(hour.temperature)}°</span>
                      {hour.precipitationProbability > 10 && (
                        <span className="text-[10px] text-blue-500">{hour.precipitationProbability}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Wind max.</p>
                  <p className="font-bold text-slate-800">{Math.round(daily[0].windSpeedMax)} km/h</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">UV-Index</p>
                  <p className="font-bold" style={{ color: getUVIndexLevel(daily[0].uvIndexMax).color }}>
                    {daily[0].uvIndexMax} - {getUVIndexLevel(daily[0].uvIndexMax).level}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Sonnenaufgang</p>
                  <p className="font-bold text-slate-800">{formatTime(daily[0].sunrise)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Sonnenuntergang</p>
                  <p className="font-bold text-slate-800">{formatTime(daily[0].sunset)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Days Forecast */}
        {activeTab === '3days' && (
          <div className="space-y-4">
            {daily.slice(0, 3).map((day, idx) => {
              const uvInfo = getUVIndexLevel(day.uvIndexMax);
              const dayHourly = hourly.filter(h => h.time.startsWith(day.date));

              return (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(day.icon, 32)}
                      <div>
                        <h3 className="font-bold text-slate-800">{formatDate(day.date)}</h3>
                        <p className="text-sm text-slate-500">{day.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        <span className="text-red-500">{Math.round(day.temperatureMax)}°</span>
                        {' / '}
                        <span className="text-blue-500">{Math.round(day.temperatureMin)}°</span>
                      </p>
                      {day.precipitationProbability > 0 && (
                        <p className="text-sm text-blue-500 flex items-center justify-end gap-1">
                          <Umbrella size={12} />
                          {day.precipitationProbability}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hourly for this day */}
                  {dayHourly.length > 0 && (
                    <div className="overflow-x-auto">
                      <div className="flex p-4 gap-3 min-w-max">
                        {dayHourly.map((hour, hIdx) => (
                          <div key={hIdx} className="flex flex-col items-center min-w-[55px] p-2">
                            <span className="text-xs text-slate-500">{formatHour(hour.time)}</span>
                            <div className="my-1">{getWeatherIcon(hour.icon, 22)}</div>
                            <span className="font-medium text-slate-800 text-sm">{Math.round(hour.temperature)}°</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day stats */}
                  <div className="px-4 pb-4 grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 rounded p-2 text-center">
                      <p className="text-slate-500">Wind</p>
                      <p className="font-medium">{Math.round(day.windSpeedMax)} km/h</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2 text-center">
                      <p className="text-slate-500">Niederschlag</p>
                      <p className="font-medium">{day.precipitation} mm</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2 text-center">
                      <p className="text-slate-500">UV</p>
                      <p className="font-medium" style={{ color: uvInfo.color }}>{day.uvIndexMax}</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2 text-center">
                      <p className="text-slate-500">Sonne</p>
                      <p className="font-medium">{formatTime(day.sunrise).slice(0, 5)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 7 Days Forecast */}
        {activeTab === '7days' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">7-Tage-Vorhersage</h2>
              <p className="text-sm text-slate-500">Wochenübersicht</p>
            </div>
            <div className="divide-y divide-slate-100">
              {daily.slice(0, 7).map((day, idx) => {
                const uvInfo = getUVIndexLevel(day.uvIndexMax);
                return (
                  <div
                    key={idx}
                    className={`p-4 hover:bg-slate-50 transition cursor-pointer ${selectedDay === idx ? 'bg-slate-50' : ''}`}
                    onClick={() => setSelectedDay(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-[100px]">
                        <span className={`font-medium w-16 ${idx === 0 ? t.primary : 'text-slate-700'}`}>
                          {formatDate(day.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-1 justify-center">
                        {getWeatherIcon(day.icon, 28)}
                        <span className="text-sm text-slate-500 hidden sm:block w-28">{day.description}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {day.precipitationProbability > 0 && (
                          <span className="text-sm text-blue-500 flex items-center gap-1 w-12">
                            <Umbrella size={14} />
                            {day.precipitationProbability}%
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-sm w-20 justify-end">
                          <span className="text-slate-800 font-medium">{Math.round(day.temperatureMax)}°</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{Math.round(day.temperatureMin)}°</span>
                        </div>
                      </div>

                      <ChevronRight size={18} className="text-slate-300 hidden sm:block ml-2" />
                    </div>

                    {/* Expanded Day Details */}
                    {selectedDay === idx && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Wind</p>
                          <p className="font-medium text-slate-700">{Math.round(day.windSpeedMax)} km/h</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Niederschlag</p>
                          <p className="font-medium text-slate-700">{day.precipitation} mm</p>
                        </div>
                        <div>
                          <p className="text-slate-500">UV-Index</p>
                          <p className="font-medium" style={{ color: uvInfo.color }}>{day.uvIndexMax} - {uvInfo.level}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Sonnenaufgang</p>
                          <p className="font-medium text-slate-700">{formatTime(day.sunrise)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 14 Days Forecast */}
        {activeTab === '14days' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">14-Tage-Vorhersage</h2>
              <p className="text-sm text-slate-500">Langfristige Wetteraussichten</p>
            </div>
            <div className="divide-y divide-slate-100">
              {daily.map((day, idx) => {
                const uvInfo = getUVIndexLevel(day.uvIndexMax);
                return (
                  <div
                    key={idx}
                    className={`p-4 hover:bg-slate-50 transition cursor-pointer ${selectedDay === idx ? 'bg-slate-50' : ''}`}
                    onClick={() => setSelectedDay(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <span className={`font-medium ${idx === 0 ? t.primary : 'text-slate-700'}`}>
                          {formatDate(day.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getWeatherIcon(day.icon, 24)}
                        <span className="text-sm text-slate-500 w-24 hidden sm:block">{day.description}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {day.precipitationProbability > 0 && (
                          <span className="text-sm text-blue-500 flex items-center gap-1">
                            <Umbrella size={14} />
                            {day.precipitationProbability}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-800 font-medium">{Math.round(day.temperatureMax)}°</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{Math.round(day.temperatureMin)}°</span>
                      </div>

                      <ChevronRight size={18} className="text-slate-300 hidden sm:block" />
                    </div>

                    {/* Expanded Day Details */}
                    {selectedDay === idx && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Wind</p>
                          <p className="font-medium text-slate-700">{Math.round(day.windSpeedMax)} km/h</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Niederschlag</p>
                          <p className="font-medium text-slate-700">{day.precipitation} mm</p>
                        </div>
                        <div>
                          <p className="text-slate-500">UV-Index</p>
                          <p className="font-medium" style={{ color: uvInfo.color }}>{day.uvIndexMax} - {uvInfo.level}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Sonnenaufgang</p>
                          <p className="font-medium text-slate-700">{formatTime(day.sunrise)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Weather Radar Section */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800">Regenradar</h2>
            <p className="text-sm text-slate-500">Niederschlag in Echtzeit</p>
          </div>
          <div className="aspect-video bg-slate-100 relative">
            {/* Embedded Rain Radar from RainViewer */}
            <iframe
              src={`https://www.rainviewer.com/map.html?loc=52.2847,13.6083,9&oFa=1&oC=1&oU=1&oCS=1&oF=0&oAP=1&c=1&o=83&lm=1&layer=radar&sm=1&sn=1`}
              className="w-full h-full border-0"
              title="Regenradar Zernsdorf"
              loading="lazy"
            />
          </div>
          <div className="p-3 bg-slate-50 text-xs text-slate-500 text-center">
            Radar-Daten von RainViewer.com
          </div>
        </div>
      </section>

      {/* Additional Info Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* UV Index */}
          {daily[0] && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sun size={18} className="text-yellow-500" />
                UV-Index heute
              </h3>
              {(() => {
                const uvInfo = getUVIndexLevel(daily[0].uvIndexMax);
                return (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: uvInfo.color }}
                    >
                      {daily[0].uvIndexMax}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{uvInfo.level}</p>
                      <p className="text-sm text-slate-500">{uvInfo.advice}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pollen */}
          {pollen && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Leaf size={18} className="text-green-500" />
                Pollenflug
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Gräser', value: pollen.grass },
                  { name: 'Birke', value: pollen.birch },
                  { name: 'Erle', value: pollen.alder },
                ].map((item) => {
                  const level = getPollenLevel(item.value);
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-sm font-medium" style={{ color: level.color }}>
                        {level.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Air Quality Details */}
          {airQuality && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShieldAlert size={18} className="text-blue-500" />
                Luftqualität Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">PM2.5</span>
                  <span className="font-medium">{airQuality.pm2_5} µg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">PM10</span>
                  <span className="font-medium">{airQuality.pm10} µg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ozon (O₃)</span>
                  <span className="font-medium">{airQuality.o3} µg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Stickstoffdioxid</span>
                  <span className="font-medium">{airQuality.no2} µg/m³</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
