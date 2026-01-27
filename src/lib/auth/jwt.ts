import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, queryOne, insert, execute } from '@/lib/db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Remove auth cookie
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

// Get current user from cookie
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await queryOne<User>(
      'SELECT id, email, username, first_name, last_name, avatar_url, is_active, created_at FROM users WHERE id = ? AND is_active = 1',
      [payload.userId]
    );

    return user;
  } catch {
    return null;
  }
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  username?: string
): Promise<{ user: User; token: string } | { error: string }> {
  try {
    // Check if email exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing) {
      return { error: 'E-Mail-Adresse ist bereits registriert' };
    }

    // Check if username exists
    const usernameToUse = username || email.split('@')[0];
    const existingUsername = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE username = ?',
      [usernameToUse]
    );

    if (existingUsername) {
      return { error: 'Benutzername ist bereits vergeben' };
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const userId = await insert(
      'INSERT INTO users (email, password_hash, username, created_at) VALUES (?, ?, ?, NOW())',
      [email, passwordHash, usernameToUse]
    );

    // Assign default 'user' role
    await execute(
      'INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE name = "user"',
      [userId]
    );

    // Create profile
    await execute(
      'INSERT INTO profiles (user_id, email, username, created_at) VALUES (?, ?, ?, NOW())',
      [userId, email, usernameToUse]
    );

    const user: User = {
      id: userId,
      email,
      username: usernameToUse,
      is_active: true,
      created_at: new Date(),
    };

    const token = generateToken(userId, email);
    await setAuthCookie(token);

    return { user, token };
  } catch (error) {
    console.error('Register error:', error);
    return { error: 'Registrierung fehlgeschlagen' };
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; token: string } | { error: string }> {
  try {
    const userWithPassword = await queryOne<User & { password_hash: string }>(
      'SELECT id, email, username, first_name, last_name, avatar_url, is_active, created_at, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (!userWithPassword) {
      return { error: 'Ungültige E-Mail oder Passwort' };
    }

    if (!userWithPassword.is_active) {
      return { error: 'Konto ist deaktiviert' };
    }

    const isValid = await verifyPassword(password, userWithPassword.password_hash);
    if (!isValid) {
      return { error: 'Ungültige E-Mail oder Passwort' };
    }

    // Update last login
    await execute('UPDATE users SET last_login = NOW() WHERE id = ?', [userWithPassword.id]);

    const { password_hash, ...user } = userWithPassword;
    const token = generateToken(user.id, user.email);
    await setAuthCookie(token);

    return { user, token };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Anmeldung fehlgeschlagen' };
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  await removeAuthCookie();
}

// Update password
export async function updatePassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const passwordHash = await hashPassword(newPassword);
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'Passwort-Änderung fehlgeschlagen' };
  }
}

// Get user roles
export async function getUserRoles(userId: number): Promise<string[]> {
  const roles = await query<{ name: string }>(
    'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?',
    [userId]
  );
  return roles.map(r => r.name);
}

// Check if user has role
export async function hasRole(userId: number, roleName: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}
