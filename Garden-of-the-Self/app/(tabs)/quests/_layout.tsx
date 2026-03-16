import { Stack } from 'expo-router';

export default function QuestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Quests',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Add Quest',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
