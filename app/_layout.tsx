import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const APP_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#000000', card: '#000000' },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider value={APP_THEME}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
