import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UnistylesProvider, UnistylesRuntime, useUnistyles } from '@/lib/unistyles-compat';
import 'react-native-reanimated';

import '@/lib/unistyles';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
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

export default function RootLayout() {
  return (
    <UnistylesProvider>
      <RootLayoutContent />
    </UnistylesProvider>
  );
}
