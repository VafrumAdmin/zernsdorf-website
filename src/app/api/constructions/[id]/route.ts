import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Einzelne Baustelle abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('constructions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Baustelle nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ construction: data });
  } catch (error) {
    console.error('Get construction error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// PATCH: Baustelle aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    // Entferne Felder die nicht aktualisiert werden sollen
    const { id: _, created_at, ...updateData } = body;

    const { data, error } = await supabase
      .from('constructions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating construction:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren' },
        { status: 500 }
      );
    }

    return NextResponse.json({ construction: data });
  } catch (error) {
    console.error('Update construction error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE: Baustelle löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('constructions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting construction:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete construction error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}
