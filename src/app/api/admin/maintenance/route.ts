import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin/config';
import { cookies } from 'next/headers';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const MAINTENANCE_FILE = join(process.cwd(), '.maintenance');

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return !!session?.value;
}

async function getMaintenanceStatus() {
  try {
    const content = await readFile(MAINTENANCE_FILE, 'utf-8');
    const data = JSON.parse(content);
    return {
      enabled: true,
      message: data.message || 'Die Website wird gerade gewartet.',
      estimatedEnd: data.estimatedEnd || null,
    };
  } catch {
    return {
      enabled: false,
      message: '',
      estimatedEnd: null,
    };
  }
}

// GET - Status abrufen
export async function GET() {
  const status = await getMaintenanceStatus();
  return NextResponse.json(status);
}

// POST - Wartungsmodus aktivieren
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Nicht autorisiert' },
      { status: 401 }
    );
  }

  try {
    const { message, estimatedEnd } = await request.json();

    const data = {
      enabled: true,
      message: message || 'Die Website wird gerade gewartet. Bitte versuchen Sie es später erneut.',
      estimatedEnd: estimatedEnd || null,
      activatedAt: new Date().toISOString(),
    };

    await writeFile(MAINTENANCE_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json(
      { error: 'Fehler beim Aktivieren des Wartungsmodus' },
      { status: 500 }
    );
  }
}

// DELETE - Wartungsmodus deaktivieren
export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Nicht autorisiert' },
      { status: 401 }
    );
  }

  try {
    const { unlink } = await import('fs/promises');
    await unlink(MAINTENANCE_FILE);
    return NextResponse.json({ success: true, enabled: false });
  } catch {
    // Datei existiert möglicherweise nicht, das ist OK
    return NextResponse.json({ success: true, enabled: false });
  }
}
