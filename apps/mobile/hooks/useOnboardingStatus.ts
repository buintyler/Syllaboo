import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';

interface OnboardingStatus {
  isLoading: boolean;
  onboardingComplete: boolean;
  refetch: () => Promise<void>;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      setOnboardingComplete(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('clerk_id', user.id)
        .single();

      if (error || !data) {
        setOnboardingComplete(false);
      } else {
        setOnboardingComplete((data.onboarding_complete as boolean) ?? false);
      }
    } catch {
      setOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user, supabase]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { isLoading, onboardingComplete, refetch: fetchStatus };
}
