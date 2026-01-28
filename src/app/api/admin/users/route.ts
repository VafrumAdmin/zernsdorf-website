import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Liste aller Nutzer (aus Supabase Auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Hole Nutzer aus Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page,
      perPage: limit
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    // Transformiere Auth-Nutzer in unser Format
    let users = (authData?.users || []).map(user => ({
      id: user.id,
      auth_user_id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || null,
      display_name: user.user_metadata?.display_name || user.user_metadata?.username || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_active: true,
      is_verified: user.email_confirmed_at ? true : false,
      is_banned: false,
      ban_reason: null,
      banned_at: null,
      created_at: user.created_at,
      last_login_at: user.last_sign_in_at,
      login_count: 0,
      user_roles: [{ roles: { name: 'member', display_name: 'Mitglied', color: '#6B7280' } }]
    }));

    // Filter nach Suche
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        (u.username && u.username.toLowerCase().includes(searchLower)) ||
        (u.display_name && u.display_name.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      users,
      total: authData?.users?.length || 0,
      page,
      limit,
      source: 'auth'
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      source: 'error',
      error: String(error)
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
