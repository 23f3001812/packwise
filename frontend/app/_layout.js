import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

// Navigation gatekeeper component that routes based on authentication state
function RouteGuard({ children }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isSplash = segments.length === 0 || segments[0] === 'index';

    if (!user) {
      // If user is not authenticated and trying to access tabs, redirect to auth onboarding
      if (inTabsGroup) {
        router.replace('/(auth)/onboarding');
      }
    } else {
      // If user is authenticated and in auth group or splash, redirect to dashboard
      if (inAuthGroup || isSplash) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <RouteGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </RouteGuard>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

