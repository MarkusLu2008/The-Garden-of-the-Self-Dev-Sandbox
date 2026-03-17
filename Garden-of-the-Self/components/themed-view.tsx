import { View, type ViewProps } from 'react-native';
import { UnistylesRuntime, useUnistyles } from '@/lib/unistyles-compat';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { theme } = useUnistyles();
  const themeName = UnistylesRuntime.themeName;
  const backgroundColor =
    (themeName === 'light' && lightColor) ||
    (themeName === 'dark' && darkColor) ||
    theme.colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
