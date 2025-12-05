import { Stack } from 'expo-router';

export default function JournalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen 
        name="index"
        options={{
          title: 'Journals',
        }}
      />
      <Stack.Screen 
        name="editor"
        options={{
          title: 'Editor',
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="create"
        options={{
          title: 'Create Journal',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

