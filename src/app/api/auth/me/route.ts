import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRoles } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const roles = await getUserRoles(user.id);

    return NextResponse.json({
      user: {
        ...user,
        roles,
      },
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ user: null });
  }
}
