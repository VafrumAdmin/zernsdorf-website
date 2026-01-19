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
