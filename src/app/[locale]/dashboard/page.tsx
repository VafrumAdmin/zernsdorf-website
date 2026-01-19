'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  Waves,
  Activity,
  AlertTriangle,
  Calendar,
  Trash2,
  TrendingUp,
  Users,
  ArrowRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Train,
  Bus,
  Clock,
} from 'lucide-react';
import {
  getFallbackWeather,
  getFallbackAirQuality,
  getAqiLabel,
  getWindDirection,
  type WeatherData,
  type AirQualityData,
} from '@/lib/weather';

interface TransitDeparture {
  lineName: string;
  direction: string;
  plannedTime: string;
  actualTime: string | null;
  delay: number;
  product: 'bus' | 'regional';
  stop: string;
}

export default function DashboardPage() {
  const [weather, setWeather] = useState<WeatherData>(getFallbackWeather());
  const [airQuality, setAirQuality] = useState<AirQualityData>(getFallbackAirQuality());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ÖPNV State
  const [departures, setDepartures] = useState<TransitDeparture[]>([]);
  const [transitLoading, setTransitLoading] = useState(true);
  const [transitLive, setTransitLive] = useState(false);

  // Fetch transit data from API
  const fetchTransitData = async () => {
    console.log('[Dashboard] Fetching transit data...');
    setTransitLoading(true);
    try {
      const response = await fetch('/api/transit?stop=bahnhof&limit=6');
      const data = await response.json();
      console.log('[Dashboard] Transit data received:', data.departures?.length, 'departures');
      setDepartures(data.departures || []);
      setTransitLive(data.isLive || false);
    } catch (error) {
      console.error('[Dashboard] Failed to fetch transit:', error);
    } finally {
      setTransitLoading(false);
    }
  };

  // Fetch weather data from API
  const fetchWeatherData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather');
      const data = await response.json();

      // Parse dates from JSON
      const weatherData = {
        ...data.weather,
        sunrise: new Date(data.weather.sunrise),
        sunset: new Date(data.weather.sunset),
      };

      setWeather(weatherData);
      setAirQuality(data.airQuality);
      setIsLive(data.isLive);
      if (data.lastUpdated) {
        setLastUpdated(new Date(data.lastUpdated));
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    fetchTransitData();
    // Refresh weather every 5 minutes, transit every minute
    const weatherInterval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    const transitInterval = setInterval(fetchTransitData, 60 * 1000);
    return () => {
      clearInterval(weatherInterval);
      clearInterval(transitInterval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const aqiInfo = getAqiLabel(airQuality.aqi);

  return (
    <div className="min-h-screen bg-[#050508] py-8 px-4 lg:px-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1 opacity-30" />
        <div className="orb orb-2 opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Live <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-[#71717a]">Echtzeit-Daten aus Zernsdorf am Zernsdorfer Lankensee</p>
            </div>
            <div className="glass px-6 py-3 rounded-2xl">
              <div className="text-3xl font-bold font-mono">
                {currentTime.toLocaleTimeString('de-DE')}
              </div>
              <div className="text-sm text-[#71717a]">
                {currentTime.toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Weather Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Weather */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-[#71717a]">Aktuelles Wetter</span>
                {isLive ? (
                  <span className="flex items-center gap-1 text-xs text-[#10b981]">
                    <Wifi className="w-3 h-3" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <WifiOff className="w-3 h-3" />
                    Demo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-6xl md:text-7xl font-bold">
                  {weather.temperature.toFixed(0)}°
                </div>
                <div>
                  <div className="text-xl capitalize">{weather.description}</div>
                  <div className="text-[#71717a]">
                    Gefühlt {weather.feelsLike.toFixed(0)}°C
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sunrise className="w-4 h-4 text-orange-400" />
                  <span>{weather.sunrise.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sunset className="w-4 h-4 text-purple-400" />
                  <span>{weather.sunset.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: Wind,
                  label: 'Wind',
                  value: `${weather.windSpeed.toFixed(0)} km/h`,
                  sub: getWindDirection(weather.windDirection),
                  color: '#00d4ff',
                },
                {
                  icon: Droplets,
                  label: 'Luftfeuchtigkeit',
                  value: `${weather.humidity}%`,
                  sub: weather.humidity > 70 ? 'Hoch' : 'Normal',
                  color: '#3b82f6',
                },
                {
                  icon: Gauge,
                  label: 'Luftdruck',
                  value: `${weather.pressure} hPa`,
                  sub: weather.pressure > 1013 ? 'Hoch' : 'Tief',
                  color: '#a855f7',
                },
                {
                  icon: Eye,
                  label: 'Sichtweite',
                  value: `${weather.visibility} km`,
                  sub: weather.visibility > 8 ? 'Gut' : 'Mäßig',
                  color: '#10b981',
                },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-2xl p-4">
                  <item.icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-[#71717a]">{item.label}</div>
                  <div className="text-xs mt-1" style={{ color: item.color }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ÖPNV Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-[#00d4ff]" />
              <span className="font-medium">ÖPNV Zernsdorf Bahnhof</span>
            </div>
            <div className="flex items-center gap-2">
              {transitLive ? (
                <span className="flex items-center gap-1 text-xs text-[#10b981]">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[#71717a]">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              )}
              <button
                onClick={fetchTransitData}
                disabled={transitLoading}
                className="p-1 text-[#71717a] hover:text-[#00d4ff] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${transitLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {transitLoading && departures.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-[#71717a]">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Lade Abfahrten...
            </div>
          ) : departures.length === 0 ? (
            <div className="text-center py-6 text-[#71717a]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Keine Verbindungen gefunden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {departures.slice(0, 5).map((dep, idx) => {
                const plannedTime = new Date(dep.plannedTime);
                const actualTime = dep.actualTime ? new Date(dep.actualTime) : plannedTime;
                const now = new Date();
                const diffMs = actualTime.getTime() - now.getTime();
                const minutesUntil = Math.round(diffMs / 60000);
                const delayMinutes = Math.round(dep.delay / 60);

                // Format für Anzeige
                const formatTimeUntil = () => {
                  if (minutesUntil <= 0) return 'Jetzt';
                  if (minutesUntil < 60) return `${minutesUntil}'`;
                  if (minutesUntil < 120) {
                    const mins = minutesUntil - 60;
                    return mins > 0 ? `1h ${mins}'` : '1h';
                  }
                  const hours = Math.floor(minutesUntil / 60);
                  const mins = minutesUntil % 60;
                  return mins > 0 ? `${hours}h ${mins}'` : `${hours}h`;
                };

                // Prüfe ob morgen
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow = actualTime.toDateString() === tomorrow.toDateString();
                const timeStr = actualTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        dep.product === 'regional' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        {dep.product === 'regional' ? (
                          <Train className={`w-5 h-5 ${dep.product === 'regional' ? 'text-red-400' : 'text-blue-400'}`} />
                        ) : (
                          <Bus className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            dep.product === 'regional' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {dep.lineName}
                          </span>
                          <span className="text-sm text-[#71717a]">→</span>
                          <span className="text-sm truncate max-w-[150px] md:max-w-none">
                            {dep.direction.replace(', Bahnhof', '').replace(' Bhf', '')}
                          </span>
                        </div>
                        <div className="text-xs text-[#71717a]">
                          {isTomorrow ? `Morgen ${timeStr}` : timeStr}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">
                        {formatTimeUntil()}
                      </div>
                      {delayMinutes > 0 && (
                        <div className="text-xs text-yellow-400">
                          +{delayMinutes} Min
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/transit" className="block mt-4">
            <button className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2">
              Alle Verbindungen
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>

        {/* Secondary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Air Quality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00d4ff]" />
                <span className="font-medium">Luftqualität</span>
              </div>
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${aqiInfo.color}20`, color: aqiInfo.color }}
              >
                {aqiInfo.label}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'PM2.5', value: airQuality.pm2_5, unit: 'µg/m³', max: 25 },
                { label: 'PM10', value: airQuality.pm10, unit: 'µg/m³', max: 50 },
                { label: 'Ozon', value: airQuality.o3, unit: 'µg/m³', max: 120 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#71717a]">{item.label}</span>
                    <span>{item.value} {item.unit}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                        backgroundColor: item.value < item.max * 0.5 ? '#10b981' : item.value < item.max ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Zernsdorfer Lankensee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-[#00d4ff]" />
              <span className="font-medium">Lankensee</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#71717a]">Wassertemperatur</span>
                <span className="text-xl font-bold text-[#00d4ff]">4.2°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717a]">Pegelstand</span>
                <span className="text-xl font-bold">32.45 m ü. NHN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717a]">Badequalität</span>
                <span className="text-sm px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  Saison beendet
                </span>
              </div>
              <Link href="/map" className="block">
                <button className="w-full mt-2 btn-secondary text-sm py-2">
                  Auf Karte anzeigen
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
              <span className="font-medium">Übersicht</span>
            </div>
            <div className="space-y-4">
              <Link href="/waste" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-[#00d4ff] transition-colors">Nächste Abholung</div>
                    <div className="text-xs text-[#71717a]">Gelber Sack</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Morgen</div>
                </div>
              </Link>
              <Link href="/traffic" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-[#00d4ff] transition-colors">Baustellen</div>
                    <div className="text-xs text-[#71717a]">In der Region</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">2 aktiv</div>
                </div>
              </Link>
              <Link href="/events" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-[#00d4ff] transition-colors">Events</div>
                    <div className="text-xs text-[#71717a]">Diesen Monat</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">3</div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* API Status & Refresh */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 text-sm text-[#71717a]"
        >
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <span className="status-dot status-online" />
                <span>Live-Daten von OpenWeatherMap</span>
              </>
            ) : (
              <>
                <span className="status-dot" style={{ backgroundColor: '#71717a' }} />
                <span>Demo-Daten • OPENWEATHERMAP_API_KEY in .env.local für Live-Daten</span>
              </>
            )}
          </div>
          <button
            onClick={fetchWeatherData}
            disabled={isLoading}
            className="flex items-center gap-1 text-[#00d4ff] hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </motion.div>
      </div>
    </div>
  );
}
