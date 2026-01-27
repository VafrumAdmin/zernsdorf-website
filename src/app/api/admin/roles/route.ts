import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Liste aller Rollen mit Berechtigungen
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission_id,
          permissions(name, display_name, category)
        )
      `)
      .order('priority', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
        return NextResponse.json({
          roles: getDefaultRoles(),
          source: 'fallback'
        });
      }
      throw error;
    }

    return NextResponse.json({
      roles: roles || getDefaultRoles(),
      source: roles?.length ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Roles fetch error:', error);
    return NextResponse.json({
      roles: getDefaultRoles(),
      source: 'fallback'
    });
  }
}

// POST - Neue Rolle erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, display_name, description, color, priority } = body;

    if (!name || !display_name) {
      return NextResponse.json({ error: 'Name und Anzeigename erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('roles')
      .insert({
        name,
        display_name,
        description,
        color: color || '#6B7280',
        priority: priority || 0,
        is_system: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ role: data }, { status: 201 });
  } catch (error) {
    console.error('Role create error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Rolle' },
      { status: 500 }
    );
  }
}

// PATCH - Rolle aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, permissions, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rolle aktualisieren
    const { data, error } = await supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Berechtigungen aktualisieren wenn angegeben
    if (permissions && Array.isArray(permissions)) {
      // Alte Berechtigungen löschen
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      // Neue Berechtigungen hinzufügen
      if (permissions.length > 0) {
        const permissionInserts = permissions.map((permId: string) => ({
          role_id: id,
          permission_id: permId
        }));

        await supabase
          .from('role_permissions')
          .insert(permissionInserts);
      }
    }

    return NextResponse.json({ role: data });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' },
      { status: 500 }
    );
  }
}

// DELETE - Rolle löschen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prüfen ob System-Rolle
    const { data: role } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (role?.is_system) {
      return NextResponse.json(
        { error: 'System-Rollen können nicht gelöscht werden' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Role delete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}

function getDefaultRoles() {
  return [
    {
      id: 'role-1',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Vollzugriff auf alle Funktionen',
      color: '#DC2626',
      icon: 'shield',
      priority: 100,
      is_system: true,
      is_active: true
    },
    {
      id: 'role-2',
      name: 'moderator',
      display_name: 'Moderator',
      description: 'Kann Inhalte moderieren und Nutzer verwarnen',
      color: '#F59E0B',
      icon: 'shield-check',
      priority: 80,
      is_system: true,
      is_active: true
    },
    {
      id: 'role-3',
      name: 'editor',
      display_name: 'Redakteur',
      description: 'Kann Inhalte erstellen und bearbeiten',
      color: '#3B82F6',
      icon: 'pen-tool',
      priority: 60,
      is_system: true,
      is_active: true
    },
    {
      id: 'role-4',
      name: 'verified',
      display_name: 'Verifiziert',
      description: 'Verifizierter Einwohner von Zernsdorf',
      color: '#10B981',
      icon: 'badge-check',
      priority: 40,
      is_system: true,
      is_active: true
    },
    {
      id: 'role-5',
      name: 'member',
      display_name: 'Mitglied',
      description: 'Registriertes Mitglied',
      color: '#6B7280',
      icon: 'user',
      priority: 20,
      is_system: true,
      is_active: true
    },
    {
      id: 'role-6',
      name: 'guest',
      display_name: 'Gast',
      description: 'Nicht registrierter Besucher',
      color: '#9CA3AF',
      icon: 'user-x',
      priority: 0,
      is_system: true,
      is_active: true
    }
  ];
}
