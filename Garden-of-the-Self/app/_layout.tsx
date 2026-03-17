import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import 'react-native-reanimated';

import '@/lib/unistyles';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useUnistyles();
  const themeName = UnistylesRuntime.themeName;

  return (
    <ThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
