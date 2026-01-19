import { NextResponse } from 'next/server';
import {
  fetchWeather,
  fetchAirQuality,
  getFallbackWeather,
  getFallbackAirQuality,
} from '@/lib/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  try {
    // Open-Meteo braucht keinen API-Key, funktioniert immer
    const [weather, airQuality] = await Promise.all([
      fetchWeather(apiKey || undefined),
      fetchAirQuality(apiKey || undefined),
    ]);

    if (!weather) {
      return NextResponse.json({
        weather: getFallbackWeather(),
        airQuality: airQuality || getFallbackAirQuality(),
        isLive: false,
        error: 'Weather API unavailable, using fallback.',
      });
    }

    return NextResponse.json({
      weather,
      airQuality: airQuality || getFallbackAirQuality(),
      isLive: true,
      source: 'open-meteo',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      weather: getFallbackWeather(),
      airQuality: getFallbackAirQuality(),
      isLive: false,
      error: 'API error, using fallback data.',
    });
  }
}
