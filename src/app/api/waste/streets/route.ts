import { NextResponse } from 'next/server';
import { ZERNSDORF_STREETS } from '@/lib/waste/zernsdorf-streets';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

/**
 * GET /api/waste/streets
 * Gibt die Liste aller verfügbaren Straßen in Zernsdorf zurück
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    streets: ZERNSDORF_STREETS,
    total: ZERNSDORF_STREETS.length,
  });
}
