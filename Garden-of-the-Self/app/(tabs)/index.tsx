import { Redirect } from 'expo-router';
// Temporary redirect to journals screen because we don't have a main screen yet
export default function Index() {
  return <Redirect href="/(tabs)/journals" />;
}

