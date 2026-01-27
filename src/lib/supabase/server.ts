import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Check if admin/service role is configured
export function isServiceRoleConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Admin client with service role key (bypasses RLS)
export function createAdminClient() {
  if (!isServiceRoleConfigured()) {
    // Fallback to normal client if service role not configured
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured, admin operations may fail due to RLS');
    return null;
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function createClient() {
  // Return null-safe mock if not configured
  if (!isSupabaseConfigured()) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: {}, error: { message: 'Supabase not configured' } }),
        updateUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      },
      from: () => {
        const chainable = {
          select: () => chainable,
          eq: () => chainable,
          neq: () => chainable,
          is: () => chainable,
          in: () => chainable,
          or: () => chainable,
          order: () => chainable,
          limit: () => chainable,
          range: () => chainable,
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          then: (resolve: (value: { data: never[]; error: null }) => void) => resolve({ data: [], error: null }),
          data: [],
          error: null,
        };
        return {
          select: () => chainable,
          insert: async () => ({ data: null, error: null }),
          update: () => chainable,
          delete: () => chainable,
          upsert: async () => ({ data: null, error: null }),
        };
      },
    } as unknown as ReturnType<typeof createServerClient>;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
