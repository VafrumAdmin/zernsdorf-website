'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
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
    session: null,
    profile: null,
    roles: [],
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userId);

    const roles = userRoles?.map((ur: unknown) => {
      const userRole = ur as { role: { name: string } | null };
      return userRole.role?.name;
    }).filter(Boolean) as string[] || [];

    return { profile, roles };
  }, [supabase]);

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { profile, roles } = await fetchProfile(session.user.id);

        setState({
          user: session.user,
          session,
          profile,
          roles,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: roles.includes('admin'),
          isModerator: roles.includes('admin') || roles.includes('moderator'),
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { profile, roles } = await fetchProfile(session.user.id);

          setState({
            user: session.user,
            session,
            profile,
            roles,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: roles.includes('admin'),
            isModerator: roles.includes('admin') || roles.includes('moderator'),
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            profile: null,
            roles: [],
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
            isModerator: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id);

    if (error) {
      throw error;
    }

    // Refresh profile
    const { profile, roles } = await fetchProfile(state.user.id);
    setState(prev => ({
      ...prev,
      profile,
      roles,
    }));
  };

  const refreshProfile = async () => {
    if (!state.user) return;

    const { profile, roles } = await fetchProfile(state.user.id);
    setState(prev => ({
      ...prev,
      profile,
      roles,
      isAdmin: roles.includes('admin'),
      isModerator: roles.includes('admin') || roles.includes('moderator'),
    }));
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
