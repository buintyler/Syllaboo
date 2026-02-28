import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  if (!__DEV__) {
    throw new Error(
      'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }
}

type TokenGetter = () => Promise<string | null>;

/**
 * Creates a Supabase client that injects the Clerk JWT on every request.
 *
 * Requires a "supabase" JWT template in Clerk Dashboard and the Clerk JWKS
 * endpoint added to Supabase's JWT settings.
 */
export function createSupabaseClient(getToken: TokenGetter): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (input, init = {}) => {
        const clerkToken = await getToken();
        const headers = new Headers(init.headers);
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`);
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
}
