import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useJournalStyles, spacing } from '@/utils/styles';

export default function GardenScreen() {
  const journalStyles = useJournalStyles();

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        <IconSymbol
          name="leaf.fill"
          size={80}
          color={journalStyles.colors.icon}
          style={styles.icon}
        />
        <ThemedText type="title" style={styles.title}>
          Your Garden
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Complete quests to grow your virtues. Your garden will flourish as you
          tend to it through journaling and reflection.
        </ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  icon: {
    opacity: 0.5,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 320,
  },
});
