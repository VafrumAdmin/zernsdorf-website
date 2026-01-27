import { NextResponse } from 'next/server';
import {
  fetchWeatherForecast,
  fetchAirQuality,
  fetchPollenData,
  getFallbackWeather,
  getFallbackAirQuality,
} from '@/lib/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cache - always fresh data

export async function GET() {
  try {
    const [forecast, airQuality, pollen] = await Promise.all([
      fetchWeatherForecast(),
      fetchAirQuality(),
      fetchPollenData(),
    ]);

    if (!forecast) {
      return NextResponse.json({
        current: getFallbackWeather(),
        hourly: [],
        daily: [],
        airQuality: airQuality || getFallbackAirQuality(),
        pollen: null,
        isLive: false,
        error: 'Weather API unavailable',
      });
    }

    return NextResponse.json({
      ...forecast,
      airQuality: airQuality || getFallbackAirQuality(),
      pollen,
      isLive: true,
      source: 'open-meteo',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather forecast API error:', error);
    return NextResponse.json({
      current: getFallbackWeather(),
      hourly: [],
      daily: [],
      airQuality: getFallbackAirQuality(),
      pollen: null,
      isLive: false,
      error: 'API error',
    });
  }
}
