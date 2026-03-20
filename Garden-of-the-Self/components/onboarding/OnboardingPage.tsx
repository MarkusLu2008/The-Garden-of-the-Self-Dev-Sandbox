import { StyleSheet, View } from 'react-native';
import { useUnistyles } from '@/lib/unistyles-compat';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { OnboardingPageData } from './onboarding-content';

type Props = {
  page: OnboardingPageData;
  width: number;
};

export function OnboardingPage({ page, width }: Props) {
  const { theme } = useUnistyles();
  const iconColor = theme.colors[page.highlightColor];

  return (
    <View style={[styles.container, { width }]}>
      <IconSymbol name={page.icon} size={80} color={iconColor} />
      <ThemedText type="title" style={styles.title}>
        {page.title}
      </ThemedText>
      <ThemedText style={styles.description}>{page.description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
  },
  description: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 26,
    opacity: 0.8,
  },
});
