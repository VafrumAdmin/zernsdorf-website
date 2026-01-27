'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { LoginForm, RegisterForm } from '@/types/database';

export async function login(formData: LoginForm) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function register(formData: RegisterForm) {
  const supabase = await createClient();

  // Validate passwords match
  if (formData.password !== formData.password_confirm) {
    return { error: 'Passwörter stimmen nicht überein' };
  }

  // Validate terms acceptance
  if (!formData.accept_terms || !formData.accept_privacy) {
    return { error: 'Sie müssen die Nutzungsbedingungen und Datenschutzerklärung akzeptieren' };
  }

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        username: formData.username,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert' };
    }
    return { error: error.message };
  }

  return { success: 'Bestätigungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihr Postfach.' };
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.' };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Passwort wurde erfolgreich geändert' };
}

export async function getUser() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  return user;
}

export async function getSession() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();

  return session;
}

export async function getUserProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getUserWithRoles() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('users_with_roles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updateProfile(profileData: Record<string, unknown>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nicht eingeloggt' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard', 'layout');
  return { success: 'Profil wurde aktualisiert' };
}

export async function hasRole(roleName: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id);

  if (!data) {
    return false;
  }

  return data.some((ur: unknown) => {
    const userRole = ur as { role: { name: string } | null };
    return userRole.role?.name === roleName;
  });
}

export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

export async function isModerator(): Promise<boolean> {
  const isAdminUser = await hasRole('admin');
  const isModUser = await hasRole('moderator');
  return isAdminUser || isModUser;
}
