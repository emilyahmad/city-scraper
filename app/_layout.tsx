import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthHydrated, useAuthStore } from '@/store/auth';

const APP_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#000000', card: '#000000' },
};

export default function RootLayout() {
  const hydrated = useAuthHydrated();
  const signedIn = useAuthStore((state) => state.firstName !== null);
  const onboarded = useAuthStore((state) => state.onboarded);

  // Wait for the saved session so a returning user doesn't see the sign-in page for a moment.
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider value={APP_THEME}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)/sign-in" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && !onboarded}>
            <Stack.Screen name="(auth)/quiz" options={{ gestureEnabled: false }} />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && onboarded}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
