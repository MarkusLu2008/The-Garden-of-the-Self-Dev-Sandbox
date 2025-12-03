/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Alucard color palette (Light mode)
// https://draculatheme.com/alucard
const alucard = {
  background: '#FFFBEB',
  currentLine: '#6C664B',
  selection: '#CFCFDE',
  foreground: '#1F1F1F',
  comment: '#6C664B',
  red: '#CB3A2A',
  orange: '#A34D14',
  yellow: '#846E15',
  green: '#14710A',
  cyan: '#036A96',
  purple: '#644AC9',
  pink: '#A3144D',
};

// Dracula color palette (Dark mode)
// https://draculatheme.com
const dracula = {
  background: '#282A36',
  currentLine: '#6272A4',
  selection: '#44475A',
  foreground: '#F8F8F2',
  comment: '#6272A4',
  red: '#FF5555',
  orange: '#FFB86C',
  yellow: '#F1FA8C',
  green: '#50FA7B',
  cyan: '#8BE9FD',
  purple: '#BD93F9',
  pink: '#FF79C6',
};

export const Colors = {
  light: {
    text: alucard.foreground,
    background: alucard.background,
    tint: alucard.purple,
    icon: alucard.comment,
    tabIconDefault: alucard.comment,
    tabIconSelected: alucard.purple,
    // Additional Alucard colors
    primary: alucard.purple,
    secondary: alucard.pink,
    accent: alucard.cyan,
    success: alucard.green,
    warning: alucard.yellow,
    error: alucard.red,
    currentLine: alucard.currentLine,
    selection: alucard.selection,
  },
  dark: {
    text: dracula.foreground,
    background: dracula.background,
    tint: dracula.cyan,
    icon: dracula.comment,
    tabIconDefault: dracula.comment,
    tabIconSelected: dracula.cyan,
    // Additional Dracula colors
    primary: dracula.purple,
    secondary: dracula.pink,
    accent: dracula.cyan,
    success: dracula.green,
    warning: dracula.yellow,
    error: dracula.red,
    currentLine: dracula.currentLine,
    selection: dracula.selection,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
