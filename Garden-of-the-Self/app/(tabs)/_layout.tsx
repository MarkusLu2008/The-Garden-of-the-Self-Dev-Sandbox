import { Tabs } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useUnistyles } from '@/lib/unistyles-compat';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

const showDevTools = false;

function FilteredTabBar(props: BottomTabBarProps) {
  const routes = showDevTools
    ? props.state.routes
    : props.state.routes.filter((r) => r.name !== 'devtools');
  const currentRoute = props.state.routes[props.state.index];
  const index = routes.findIndex((r) => r.key === currentRoute.key);
  const filteredState = {
    ...props.state,
    routes,
    index: index >= 0 ? index : 0,
  };
  return <BottomTabBar {...props} state={filteredState} />;
}

export default function TabLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      tabBar={(props) => <FilteredTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tint,
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
