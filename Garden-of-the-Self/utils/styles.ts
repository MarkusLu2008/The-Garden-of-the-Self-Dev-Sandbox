import { StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Common spacing values
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

/**
 * Common border radius values
 */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
};

/**
 * Hook to get theme-aware styles and colors
 */
export function useJournalStyles() {
  const primary = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'selection');
  const icon = useThemeColor({}, 'icon');
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  return {
    colors: {
      primary,
      border,
      icon,
      background,
      text,
    },
    // Common button styles
    button: {
      primary: {
        backgroundColor: primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.sm,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      primaryText: {
        color: '#fff',
        fontWeight: '600' as const,
      },
      secondary: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: border,
        alignItems: 'center' as const,
      },
      secondaryText: {
        fontWeight: '600' as const,
      },
    },
    // Common container styles
    container: {
      flex: 1,
    },
    // Common border styles
    border: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: borderRadius.md,
    },
    // Common header border
    headerBorder: {
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
  };
}

