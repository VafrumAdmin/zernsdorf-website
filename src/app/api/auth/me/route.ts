import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    // Get user roles from database
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const roles = userRoles?.map((ur: { role: { name: string } | null }) => ur.role?.name).filter(Boolean) || [];

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        first_name: profile?.first_name || user.user_metadata?.first_name,
        last_name: profile?.last_name || user.user_metadata?.last_name,
        avatar_url: profile?.avatar_url,
        roles,
      },
      profile,
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ user: null });
  }
}
