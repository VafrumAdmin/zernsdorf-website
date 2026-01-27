'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  roles?: string[];
}

export interface Profile {
  id: number;
  user_id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  work_street?: string;
  work_house_number?: string;
  work_postal_code?: string;
  work_city?: string;
  work_arrival_time?: string;
  preferred_language?: string;
  theme?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  store_data_locally?: boolean;
  waste_street_id?: string;
  waste_notifications?: boolean;
  waste_notification_time?: string;
  favorite_bus_stops?: string[];
  commute_notifications?: boolean;
  posts_count?: number;
  comments_count?: number;
  listings_count?: number;
  reputation_points?: number;
  is_verified?: boolean;
  is_active?: boolean;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.user) {
        const roles = data.user.roles || [];
        setState({
          user: data.user,
          profile: data.profile || null,
          roles,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: roles.includes('admin'),
          isModerator: roles.includes('admin') || roles.includes('moderator'),
        });
      } else {
        setState({
          user: null,
          profile: null,
          roles: [],
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          isModerator: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Anmeldung fehlgeschlagen');
    }

    await fetchUser();
    return data;
  };

  const signUp = async (email: string, password: string, metadata?: { username?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username: metadata?.username }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registrierung fehlgeschlagen');
    }

    await fetchUser();
    return data;
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({
      user: null,
      profile: null,
      roles: [],
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isModerator: false,
    });
  };

  const resetPassword = async (email: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Fehler beim Zurücksetzen');
    }
  };

  const updatePassword = async (newPassword: string) => {
    const res = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Fehler beim Ändern des Passworts');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Fehler beim Aktualisieren');
    }

    await fetchUser();
  };

  const refreshProfile = async () => {
    await fetchUser();
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };
}
