/**
 * Compatibility layer for react-native-unistyles.
 * In development builds: re-exports the real Unistyles API.
 * In Expo Go (Nitro unavailable): provides a JS-only fallback using Colors + useColorScheme.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
};

type ThemeName = 'light' | 'dark';

type AppTheme = {
  colors: (typeof Colors)['light'];
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
};

const lightTheme: AppTheme = {
  colors: Colors.light,
  spacing,
  borderRadius,
};

const darkTheme: AppTheme = {
  colors: Colors.dark,
  spacing,
  borderRadius,
};

function getTheme(name: ThemeName): AppTheme {
  return name === 'dark' ? darkTheme : lightTheme;
}

// Fallback state for StyleSheet.create and UnistylesRuntime when not in React tree
let fallbackThemeName: ThemeName = 'light';
let fallbackTheme: AppTheme = lightTheme;

function setFallbackTheme(name: ThemeName) {
  fallbackThemeName = name;
  fallbackTheme = getTheme(name);
}

// Try to load real Unistyles (fails in Expo Go)
let realUnistyles: typeof import('react-native-unistyles') | null = null;
try {
  realUnistyles = require('react-native-unistyles');
} catch {
  // Expo Go: Nitro not available
}

const isExpoGo = realUnistyles === null;

// Context for fallback useUnistyles so components re-render when theme changes
type UnistylesContextValue = { theme: AppTheme; themeName: ThemeName };
const UnistylesContext = createContext<UnistylesContextValue>({
  theme: lightTheme,
  themeName: 'light',
});

export function UnistylesProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const themeName = (colorScheme === 'dark' ? 'dark' : 'light') as ThemeName;
  const theme = useMemo(() => getTheme(themeName), [themeName]);

  const value = useMemo<UnistylesContextValue>(
    () => {
      setFallbackTheme(themeName);
      return { theme, themeName };
    },
    [theme, themeName]
  );

  if (!isExpoGo) {
    return <>{children}</>;
  }
  return (
    <UnistylesContext.Provider value={value}>{children}</UnistylesContext.Provider>
  );
}

export function useUnistyles(): { theme: AppTheme } {
  if (!isExpoGo && realUnistyles) {
    return realUnistyles.useUnistyles();
  }
  return { theme: useContext(UnistylesContext).theme };
}

export const UnistylesRuntime = {
  get themeName(): ThemeName {
    if (!isExpoGo && realUnistyles) {
      return realUnistyles.UnistylesRuntime.themeName as ThemeName;
    }
    return fallbackThemeName;
  },
  get colorScheme(): ThemeName | 'unspecified' {
    if (!isExpoGo && realUnistyles) {
      return realUnistyles.UnistylesRuntime.colorScheme as ThemeName | 'unspecified';
    }
    return fallbackThemeName;
  },
  setRootViewBackgroundColor(color: string) {
    if (!isExpoGo && realUnistyles) {
      realUnistyles.UnistylesRuntime.setRootViewBackgroundColor(color);
    }
  },
};

export const StyleSheet = (() => {
  if (!isExpoGo && realUnistyles) {
    return realUnistyles.StyleSheet;
  }
  return {
    configure: (_opts: unknown) => {},
    create<T extends Record<string, unknown>>(
      creator: (theme: AppTheme) => T
    ): T {
      return new Proxy({} as T, {
        get(_, key: string) {
          const sheet = creator(fallbackTheme);
          return sheet[key as keyof T];
        },
      });
    },
  };
})();
