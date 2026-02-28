import { useUser } from '@clerk/clerk-expo';
import { useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

interface SyncResult {
  userId: string;
  onboardingComplete: boolean;
}

export function useUserSync() {
  const { user } = useUser();
  const supabase = useSupabaseClient();

  const syncUser = useCallback(async (): Promise<SyncResult> => {
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? '',
        },
        { onConflict: 'clerk_id' },
      )
      .select('id, onboarding_complete')
      .single();

    if (error) throw error;

    return {
      userId: data.id as string,
      onboardingComplete: (data.onboarding_complete as boolean) ?? false,
    };
  }, [user, supabase]);

  return { syncUser };
}
