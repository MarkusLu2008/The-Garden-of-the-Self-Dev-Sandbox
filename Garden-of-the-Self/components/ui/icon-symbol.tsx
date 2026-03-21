// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Map our icon names to Material Icons (used on all platforms).
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 */
const MAPPING: Record<string, MaterialIconName> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'book.fill': 'menu-book',
  'wrench.and.screwdriver.fill': 'build',
  'plus.circle.fill': 'add-circle',
  'flag.checkered': 'flag',
  'leaf.fill': 'eco',
  // Garden tree/plant icons
  'tree.fill': 'park',
  'bush.fill': 'nature',
  'cactus.fill': 'grass',
  'leaf.circle.fill': 'local-florist',
  'questionmark.circle': 'help-outline',
  'gearshape.fill': 'settings',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name as keyof typeof MAPPING];
  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
