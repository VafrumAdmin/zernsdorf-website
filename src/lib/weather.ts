// Weather API Integration für Zernsdorf
// Primär: Open-Meteo (kostenlos, ohne API-Key)
// Fallback: OpenWeatherMap (wenn API-Key vorhanden)

// Zernsdorf Koordinaten: 52.2847° N, 13.6083° E
const ZERNSDORF_LAT = 52.2847;
const ZERNSDORF_LON = 13.6083;

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
  clouds: number;
  sunrise: Date;
  sunset: Date;
}

export interface AirQualityData {
  aqi: number; // 1-5 scale
  co: number;
  no2: number;
  o3: number;
  pm2_5: number;
  pm10: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  description: string;
  icon: string;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
}

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  description: string;
  icon: string;
  precipitation: number;
  precipitationProbability: number;
  windSpeedMax: number;
  windDirection: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  event: string;
  headline: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: string;
  end: string;
}

// WMO Weather Codes zu Beschreibung und Icon
function getWeatherFromWMO(code: number, isDay: boolean): { description: string; icon: string } {
  const dayNight = isDay ? 'd' : 'n';

  const weatherCodes: Record<number, { description: string; icon: string }> = {
    0: { description: 'Klar', icon: `01${dayNight}` },
    1: { description: 'Überwiegend klar', icon: `01${dayNight}` },
    2: { description: 'Teilweise bewölkt', icon: `02${dayNight}` },
    3: { description: 'Bewölkt', icon: `04${dayNight}` },
    45: { description: 'Nebel', icon: `50${dayNight}` },
    48: { description: 'Reifnebel', icon: `50${dayNight}` },
    51: { description: 'Leichter Nieselregen', icon: `09${dayNight}` },
    53: { description: 'Nieselregen', icon: `09${dayNight}` },
    55: { description: 'Starker Nieselregen', icon: `09${dayNight}` },
    61: { description: 'Leichter Regen', icon: `10${dayNight}` },
    63: { description: 'Regen', icon: `10${dayNight}` },
    65: { description: 'Starker Regen', icon: `10${dayNight}` },
    66: { description: 'Gefrierender Regen', icon: `13${dayNight}` },
    67: { description: 'Starker gefrierender Regen', icon: `13${dayNight}` },
    71: { description: 'Leichter Schneefall', icon: `13${dayNight}` },
    73: { description: 'Schneefall', icon: `13${dayNight}` },
    75: { description: 'Starker Schneefall', icon: `13${dayNight}` },
    77: { description: 'Schneegriesel', icon: `13${dayNight}` },
    80: { description: 'Leichte Regenschauer', icon: `09${dayNight}` },
    81: { description: 'Regenschauer', icon: `09${dayNight}` },
    82: { description: 'Starke Regenschauer', icon: `09${dayNight}` },
    85: { description: 'Leichte Schneeschauer', icon: `13${dayNight}` },
    86: { description: 'Schneeschauer', icon: `13${dayNight}` },
    95: { description: 'Gewitter', icon: `11${dayNight}` },
    96: { description: 'Gewitter mit Hagel', icon: `11${dayNight}` },
    99: { description: 'Gewitter mit starkem Hagel', icon: `11${dayNight}` },
  };

  return weatherCodes[code] || { description: 'Unbekannt', icon: `03${dayNight}` };
}

/**
 * Holt Wetterdaten von Open-Meteo (kostenlos, ohne API-Key)
 */
export async function fetchWeatherOpenMeteo(): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${ZERNSDORF_LAT}&longitude=${ZERNSDORF_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,is_day&daily=sunrise,sunset&timezone=Europe%2FBerlin`
    );

    if (!response.ok) {
      console.error('Open-Meteo API error:', response.status);
      return null;
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const isDay = current.is_day === 1;
    const weather = getWeatherFromWMO(current.weather_code, isDay);

    return {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      description: weather.description,
      icon: weather.icon,
      pressure: current.pressure_msl,
      visibility: 10, // Open-Meteo hat keine Sichtweite, Standard 10km
      clouds: current.cloud_cover,
      sunrise: new Date(daily.sunrise[0]),
      sunset: new Date(daily.sunset[0]),
    };
  } catch (error) {
    console.error('Failed to fetch weather from Open-Meteo:', error);
    return null;
  }
}

/**
 * Holt Wetterdaten von OpenWeatherMap (benötigt API-Key)
 */
export async function fetchWeatherOpenWeatherMap(apiKey: string): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${ZERNSDORF_LAT}&lon=${ZERNSDORF_LON}&appid=${apiKey}&units=metric&lang=de`
    );

    if (!response.ok) {
      console.error('OpenWeatherMap API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      windDirection: data.wind.deg,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // m to km
      clouds: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
    };
  } catch (error) {
    console.error('Failed to fetch weather from OpenWeatherMap:', error);
    return null;
  }
}

/**
 * Hauptfunktion: Holt Wetter - zuerst Open-Meteo, dann OpenWeatherMap als Fallback
 */
export async function fetchWeather(apiKey?: string): Promise<WeatherData | null> {
  // Versuche zuerst Open-Meteo (kostenlos, ohne Key)
  const openMeteoData = await fetchWeatherOpenMeteo();
  if (openMeteoData) {
    return openMeteoData;
  }

  // Fallback: OpenWeatherMap wenn API-Key vorhanden
  if (apiKey) {
    return await fetchWeatherOpenWeatherMap(apiKey);
  }

  return null;
}

/**
 * Holt Luftqualitätsdaten von Open-Meteo (kostenlos)
 */
export async function fetchAirQualityOpenMeteo(): Promise<AirQualityData | null> {
  try {
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${ZERNSDORF_LAT}&longitude=${ZERNSDORF_LON}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone`
    );

    if (!response.ok) {
      console.error('Open-Meteo Air Quality API error:', response.status);
      return null;
    }

    const data = await response.json();
    const current = data.current;

    // Konvertiere European AQI (0-500) zu 1-5 Skala
    const euAqi = current.european_aqi;
    let aqi = 1;
    if (euAqi > 100) aqi = 5;
    else if (euAqi > 75) aqi = 4;
    else if (euAqi > 50) aqi = 3;
    else if (euAqi > 25) aqi = 2;

    return {
      aqi,
      co: current.carbon_monoxide || 0,
      no2: current.nitrogen_dioxide || 0,
      o3: current.ozone || 0,
      pm2_5: current.pm2_5 || 0,
      pm10: current.pm10 || 0,
    };
  } catch (error) {
    console.error('Failed to fetch air quality:', error);
    return null;
  }
}

export async function fetchAirQuality(apiKey?: string): Promise<AirQualityData | null> {
  // Verwende Open-Meteo für Luftqualität (kostenlos)
  return await fetchAirQualityOpenMeteo();
}

// Fallback data when API is not available
export function getFallbackWeather(): WeatherData {
  const now = new Date();
  const isDay = now.getHours() >= 7 && now.getHours() < 18;

  return {
    temperature: 8.5,
    feelsLike: 6.2,
    humidity: 72,
    windSpeed: 12,
    windDirection: 270,
    description: 'Leicht bewölkt',
    icon: isDay ? '03d' : '03n',
    pressure: 1018,
    visibility: 10,
    clouds: 35,
    sunrise: new Date(now.setHours(7, 45, 0, 0)),
    sunset: new Date(now.setHours(16, 30, 0, 0)),
  };
}

export function getFallbackAirQuality(): AirQualityData {
  return {
    aqi: 2, // Good
    co: 230,
    no2: 12,
    o3: 45,
    pm2_5: 8,
    pm10: 15,
  };
}

export function getAqiLabel(aqi: number): { label: string; color: string } {
  const labels: Record<number, { label: string; color: string }> = {
    1: { label: 'Sehr gut', color: '#10b981' },
    2: { label: 'Gut', color: '#22c55e' },
    3: { label: 'Mäßig', color: '#f59e0b' },
    4: { label: 'Schlecht', color: '#f97316' },
    5: { label: 'Sehr schlecht', color: '#ef4444' },
  };
  return labels[aqi] || labels[3];
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Holt erweiterte Wetterdaten mit Vorhersage von Open-Meteo
 */
export async function fetchWeatherForecast(): Promise<WeatherForecast | null> {
  try {
    // Stündliche und tägliche Vorhersage
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${ZERNSDORF_LAT}&longitude=${ZERNSDORF_LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,is_day,precipitation` +
      `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant` +
      `&timezone=Europe%2FBerlin&forecast_days=14`
    );

    if (!response.ok) {
      console.error('Open-Meteo Forecast API error:', response.status);
      return null;
    }

    const data = await response.json();
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    const isDay = current.is_day === 1;
    const currentWeather = getWeatherFromWMO(current.weather_code, isDay);

    // Current Weather
    const currentData: WeatherData = {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      description: currentWeather.description,
      icon: currentWeather.icon,
      pressure: current.pressure_msl,
      visibility: 10,
      clouds: current.cloud_cover,
      sunrise: new Date(daily.sunrise[0]),
      sunset: new Date(daily.sunset[0]),
    };

    // Hourly Forecast (next 48 hours)
    const hourlyData: HourlyForecast[] = [];
    const now = new Date();

    // Parse sunrise/sunset times für jeden Tag
    const sunTimes: { [date: string]: { sunrise: Date; sunset: Date } } = {};
    for (let i = 0; i < daily.time.length; i++) {
      sunTimes[daily.time[i]] = {
        sunrise: new Date(daily.sunrise[i]),
        sunset: new Date(daily.sunset[i]),
      };
    }

    for (let i = 0; i < Math.min(hourly.time.length, 336); i++) { // Bis zu 14 Tage (336 Stunden)
      const time = new Date(hourly.time[i]);
      if (time < now) continue; // Skip past hours

      // Bestimme ob es Tag oder Nacht ist basierend auf echten Sonnenzeiten
      const dateKey = hourly.time[i].split('T')[0];
      const dayTimes = sunTimes[dateKey];
      let hourIsDay = false;
      if (dayTimes) {
        hourIsDay = time >= dayTimes.sunrise && time < dayTimes.sunset;
      } else {
        // Fallback: Winter in Brandenburg ca. 8-16:30 Uhr
        const hour = time.getHours();
        hourIsDay = hour >= 8 && hour < 17;
      }

      const weatherInfo = getWeatherFromWMO(hourly.weather_code[i], hourIsDay);

      hourlyData.push({
        time: hourly.time[i],
        temperature: hourly.temperature_2m[i],
        feelsLike: hourly.apparent_temperature[i],
        humidity: hourly.relative_humidity_2m[i],
        windSpeed: hourly.wind_speed_10m[i],
        windDirection: hourly.wind_direction_10m[i],
        weatherCode: hourly.weather_code[i],
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        precipitation: hourly.precipitation[i],
        precipitationProbability: hourly.precipitation_probability[i],
        cloudCover: hourly.cloud_cover[i],
        visibility: hourly.visibility[i] / 1000, // m to km
        uvIndex: hourly.uv_index[i],
      });
    }

    // Daily Forecast (up to 14 days)
    const dailyData: DailyForecast[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const weatherInfo = getWeatherFromWMO(daily.weather_code[i], true);

      dailyData.push({
        date: daily.time[i],
        temperatureMax: daily.temperature_2m_max[i],
        temperatureMin: daily.temperature_2m_min[i],
        weatherCode: daily.weather_code[i],
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        precipitation: daily.precipitation_sum[i],
        precipitationProbability: daily.precipitation_probability_max[i],
        windSpeedMax: daily.wind_speed_10m_max[i],
        windDirection: daily.wind_direction_10m_dominant[i],
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
        uvIndexMax: daily.uv_index_max[i],
      });
    }

    return {
      current: currentData,
      hourly: hourlyData,
      daily: dailyData,
    };
  } catch (error) {
    console.error('Failed to fetch weather forecast:', error);
    return null;
  }
}

/**
 * Holt Pollenflug-Daten (falls verfügbar)
 */
export interface PollenData {
  grass: number;
  birch: number;
  alder: number;
  mugwort: number;
  ragweed: number;
  olive: number;
}

export async function fetchPollenData(): Promise<PollenData | null> {
  try {
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${ZERNSDORF_LAT}&longitude=${ZERNSDORF_LON}&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen,olive_pollen`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current;

    return {
      grass: current.grass_pollen || 0,
      birch: current.birch_pollen || 0,
      alder: current.alder_pollen || 0,
      mugwort: current.mugwort_pollen || 0,
      ragweed: current.ragweed_pollen || 0,
      olive: current.olive_pollen || 0,
    };
  } catch (error) {
    console.error('Failed to fetch pollen data:', error);
    return null;
  }
}

export function getPollenLevel(value: number): { level: string; color: string } {
  if (value === 0) return { level: 'Keine', color: '#10b981' };
  if (value < 20) return { level: 'Gering', color: '#22c55e' };
  if (value < 50) return { level: 'Mäßig', color: '#f59e0b' };
  if (value < 100) return { level: 'Hoch', color: '#f97316' };
  return { level: 'Sehr hoch', color: '#ef4444' };
}

export function getUVIndexLevel(uv: number): { level: string; color: string; advice: string } {
  if (uv < 3) return { level: 'Niedrig', color: '#22c55e', advice: 'Kein Schutz erforderlich' };
  if (uv < 6) return { level: 'Mäßig', color: '#f59e0b', advice: 'Sonnenschutz empfohlen' };
  if (uv < 8) return { level: 'Hoch', color: '#f97316', advice: 'Schutz erforderlich' };
  if (uv < 11) return { level: 'Sehr hoch', color: '#ef4444', advice: 'Starker Schutz nötig' };
  return { level: 'Extrem', color: '#7c3aed', advice: 'Mittagssonne meiden' };
}
