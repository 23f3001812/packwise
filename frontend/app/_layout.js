import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { setupNotificationChannels } from '../services/notificationService';

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
    const protectedRoots = [
      '(tabs)',
      'lists',
      'ai',
      'collaboration',
      'locations',
      'reminders',
      'notifications',
      'settings',
    ];

    if (!user) {
      // If user is not authenticated and trying to access protected areas, redirect to auth onboarding
      if (inTabsGroup || protectedRoots.includes(segments[0])) {
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
  const router = useRouter();

  useEffect(() => {
    // Setup Android notification channels on app startup
    setupNotificationChannels().catch(() => {});

    // Listen for notification interactions (user taps notification in system tray)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data;
        if (data?.listId) {
          router.push(`/lists/${data.listId}`);
        } else {
          router.push('/notifications');
        }
      } catch (e) {
        console.warn('Notification tap navigation notice:', e.message);
      }
    });

    return () => {
      responseSub.remove();
    };
  }, []);
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

