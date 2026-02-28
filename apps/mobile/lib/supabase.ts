import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

/**
 * Creates a Supabase client using the anon key.
 *
 * Note: Once RLS policies are configured with Clerk JWT verification,
 * update this to inject the Clerk token via getToken(). This requires
 * adding the Clerk JWKS to Supabase's JWT settings first.
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}
