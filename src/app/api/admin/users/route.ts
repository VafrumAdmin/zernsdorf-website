import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Liste aller Nutzer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Versuche user_profiles Tabelle
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        user_roles(
          role_id,
          roles(name, display_name, color)
        )
      `, { count: 'exact' });

    // Filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true).eq('is_banned', false);
    } else if (status === 'banned') {
      query = query.eq('is_banned', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      // Fallback wenn Tabelle nicht existiert
      if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
        return NextResponse.json({
          users: getDemoUsers(),
          total: 5,
          page,
          limit,
          source: 'demo'
        });
      }
      throw error;
    }

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      limit,
      source: 'database'
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({
      users: getDemoUsers(),
      total: 5,
      page: 1,
      limit: 20,
      source: 'demo'
    });
  }
}

// POST - Neuen Nutzer erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, display_name, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Nutzer erstellen
    const { data: user, error } = await supabase
      .from('user_profiles')
      .insert({
        email,
        username,
        display_name,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Rolle zuweisen wenn angegeben
    if (role && user) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleData) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role_id: roleData.id
          });
      }
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('User create error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Nutzers' },
      { status: 500 }
    );
  }
}

// PATCH - Nutzer aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' },
      { status: 500 }
    );
  }
}

// DELETE - Nutzer löschen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}

function getDemoUsers() {
  return [
    {
      id: 'demo-1',
      email: 'admin@zernsdorf.de',
      username: 'admin',
      display_name: 'Administrator',
      is_active: true,
      is_verified: true,
      is_banned: false,
      created_at: '2024-01-01T10:00:00Z',
      last_login_at: '2024-01-26T15:30:00Z',
      login_count: 142,
      user_roles: [{ roles: { name: 'admin', display_name: 'Administrator', color: '#DC2626' } }]
    },
    {
      id: 'demo-2',
      email: 'moderator@zernsdorf.de',
      username: 'mod_petra',
      display_name: 'Petra Schmidt',
      is_active: true,
      is_verified: true,
      is_banned: false,
      created_at: '2024-02-15T10:00:00Z',
      last_login_at: '2024-01-25T09:15:00Z',
      login_count: 89,
      user_roles: [{ roles: { name: 'moderator', display_name: 'Moderator', color: '#F59E0B' } }]
    },
    {
      id: 'demo-3',
      email: 'hans.mueller@example.com',
      username: 'hans_m',
      display_name: 'Hans Müller',
      is_active: true,
      is_verified: true,
      is_banned: false,
      created_at: '2024-03-01T10:00:00Z',
      last_login_at: '2024-01-20T18:45:00Z',
      login_count: 23,
      user_roles: [{ roles: { name: 'verified', display_name: 'Verifiziert', color: '#10B981' } }]
    },
    {
      id: 'demo-4',
      email: 'maria.weber@example.com',
      username: 'maria_w',
      display_name: 'Maria Weber',
      is_active: true,
      is_verified: false,
      is_banned: false,
      created_at: '2024-04-10T10:00:00Z',
      last_login_at: '2024-01-22T12:00:00Z',
      login_count: 5,
      user_roles: [{ roles: { name: 'member', display_name: 'Mitglied', color: '#6B7280' } }]
    },
    {
      id: 'demo-5',
      email: 'spam@example.com',
      username: 'spammer123',
      display_name: 'Gesperrter Nutzer',
      is_active: false,
      is_verified: false,
      is_banned: true,
      ban_reason: 'Spam und unangemessene Inhalte',
      banned_at: '2024-05-15T10:00:00Z',
      created_at: '2024-05-01T10:00:00Z',
      last_login_at: '2024-05-14T10:00:00Z',
      login_count: 12,
      user_roles: [{ roles: { name: 'member', display_name: 'Mitglied', color: '#6B7280' } }]
    }
  ];
}
