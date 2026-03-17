import { StyleSheet } from '@/lib/unistyles-compat';
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

const lightTheme = {
  colors: Colors.light,
  spacing,
  borderRadius,
};

const darkTheme = {
  colors: Colors.dark,
  spacing,
  borderRadius,
};

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings: {
    adaptiveThemes: true,
  },
});
