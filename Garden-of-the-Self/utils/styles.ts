import { StyleSheet } from 'react-native-unistyles';

/**
 * Common spacing values (also available on theme.spacing)
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
 * Common border radius values (also available on theme.borderRadius)
 */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
};

/**
 * Theme-aware styles for journals/quests. Use with Unistyles theme;
 * for raw colors (e.g. primary, border) use useUnistyles().theme.colors.
 * Flattened keys for Unistyles compatibility.
 */
export const journalStyles = StyleSheet.create((theme) => ({
  buttonPrimary: {
    backgroundColor: theme.colors.tint,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  buttonSecondary: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.selection,
    alignItems: 'center' as const,
  },
  buttonSecondaryText: {
    fontWeight: '600' as const,
  },
  container: {
    flex: 1,
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.selection,
    borderRadius: theme.borderRadius.md,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.selection,
  },
}));
