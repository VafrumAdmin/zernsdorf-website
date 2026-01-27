import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './config';

/**
 * Prüft ob die Admin-Session gültig ist
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return !!session?.value;
}

/**
 * Gibt einen Fehler zurück wenn nicht authentifiziert
 */
export async function requireAdminAuth(): Promise<{ authenticated: true } | { authenticated: false; error: string }> {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return { authenticated: false, error: 'Nicht autorisiert' };
  }
  return { authenticated: true };
}
