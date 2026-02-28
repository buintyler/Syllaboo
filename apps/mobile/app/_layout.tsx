import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import LoadingScreen from '../components/LoadingScreen';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';

const publishableKey = process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

const tokenCache = {
  async getToken(key: string): Promise<string | undefined | null> {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  clearToken(key: string): void {
    SecureStore.deleteItemAsync(key);
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthGatedLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AuthGatedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isLoading, onboardingComplete } = useOnboardingStatus();

  useEffect(() => {
    if (!isLoaded) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn) {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else if (isSignedIn) {
      if (isLoading) return;

      if (!onboardingComplete && segments.join('/') !== '(auth)/consent' && segments.join('/') !== '(auth)/create-child-profile') {
        router.replace('/(auth)/consent');
      } else if (onboardingComplete && inAuthGroup) {
        router.replace('/(reading)');
      }
    }
  }, [isLoaded, isSignedIn, segments, isLoading, onboardingComplete, router, navigationState?.key]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(reading)" />
    </Stack>
  );
}
