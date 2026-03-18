import { ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UnistylesProvider, UnistylesRuntime, useUnistyles } from '@/lib/unistyles-compat';
import { Colors } from '@/constants/theme';
import { DateOverrideProvider } from '@/contexts/DateOverrideContext';
import 'react-native-reanimated';

import '@/lib/unistyles';

const LightNavTheme: Theme = {
  dark: false,
  colors: {
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.selection,
    notification: Colors.light.error,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

const DarkNavTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.selection,
    notification: Colors.dark.error,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { theme } = useUnistyles();
  const themeName = UnistylesRuntime.themeName;

  UnistylesRuntime.setRootViewBackgroundColor(theme.colors.background);

  return (
    <ThemeProvider value={themeName === 'dark' ? DarkNavTheme : LightNavTheme}>
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
      <DateOverrideProvider>
        <RootLayoutContent />
      </DateOverrideProvider>
    </UnistylesProvider>
  );
}
