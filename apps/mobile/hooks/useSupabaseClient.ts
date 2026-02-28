import { useAuth } from '@clerk/clerk-expo';
import { useMemo, useRef } from 'react';
import { createSupabaseClient } from '../lib/supabase';

export function useSupabaseClient() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useMemo(
    () =>
      createSupabaseClient(() => getTokenRef.current({ template: 'supabase' })),
    [],
  );
}
