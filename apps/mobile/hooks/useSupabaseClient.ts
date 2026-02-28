import { useMemo } from 'react';
import { createSupabaseClient } from '../lib/supabase';

export function useSupabaseClient() {
  return useMemo(() => createSupabaseClient(), []);
}
