import { View, TouchableOpacity } from 'react-native';
import { useUnistyles } from '@/lib/unistyles-compat';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { gameConfig } from '@/constants/gameConfig';

function FilteredTabBar(props: BottomTabBarProps) {
  const { theme } = useUnistyles();
  const router = useRouter();
  const routes = gameConfig.devtools.show
    ? props.state.routes
    : props.state.routes.filter((r) => r.name !== 'devtools');
  const currentRoute = props.state.routes[props.state.index];
  const index = routes.findIndex((r) => r.key === currentRoute.key);
  const filteredState = {
    ...props.state,
    routes,
    index: index >= 0 ? index : 0,
  };
  return (
    <View>
      <BottomTabBar {...props} state={filteredState} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 16,
          top: -44,
          width: 32,
          height: 32,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => router.push('/onboarding' as any)}
        activeOpacity={0.7}
      >
        <IconSymbol name="questionmark.circle" size={24} color={theme.colors.tint} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      tabBar={(props) => <FilteredTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.icon,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.selection,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="flag.checkered" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="leaf.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journals"
        options={{
          title: 'Journals',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="devtools"
        options={{
          title: 'DevTools',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="wrench.and.screwdriver.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
