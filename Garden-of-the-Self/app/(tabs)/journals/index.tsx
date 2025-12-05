import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getAllJournals } from '@/services/journalManager';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useJournalStyles, spacing, borderRadius } from '@/utils/styles';

type JournalItem = {
  id: number;
  file_path: string;
  prompt: string | null;
  virtues: string | null;
  created_at: string;
  updated_at: string;
};

export default function JournalsScreen() {
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const journalStyles = useJournalStyles();

  const loadJournals = async () => {
    try {
      setLoading(true);
      const allJournals = await getAllJournals();
      setJournals(allJournals);
    } catch (error) {
      console.error('Failed to load journals:', error);
      Alert.alert('Error', 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, []);

  const handleNewJournal = () => {
    router.push('/(tabs)/journals/create');
  };

  const handleJournalPress = (file_path: string) => {
    router.push(`/(tabs)/journals/editor?date=${file_path}`);
  };

  const renderJournalItem = ({ item }: { item: JournalItem }) => (
    <TouchableOpacity
      style={styles.journalItem}
      onPress={() => handleJournalPress(item.file_path)}
      activeOpacity={0.7}
    >
      <ThemedView style={[journalStyles.border, styles.journalContent]}>
        <ThemedText type="defaultSemiBold" style={styles.journalDate}>
          {formatDateForDisplay(item.file_path)}
        </ThemedText>
        {item.prompt && (
          <ThemedText style={styles.promptText} numberOfLines={1}>
            💭 {item.prompt}
          </ThemedText>
        )}
        {item.virtues && (
          <ThemedText style={styles.virtuesText} numberOfLines={1}>
            ⭐ {item.virtues}
          </ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <IconSymbol name="book.fill" size={64} color={journalStyles.colors.icon} style={styles.emptyIcon} />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No journals yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Start your journey by creating your first journal entry
      </ThemedText>
      <TouchableOpacity style={journalStyles.button.primary} onPress={handleNewJournal}>
        <ThemedText style={journalStyles.button.primaryText}>Create First Journal</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Journals
        </ThemedText>
        <TouchableOpacity
          style={styles.newJournalButton}
          onPress={handleNewJournal}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={journalStyles.colors.primary} />
        </TouchableOpacity>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      ) : journals.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={journals}
          renderItem={renderJournalItem}
          keyExtractor={(item) => item.file_path}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadJournals}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    flex: 1,
  },
  newJournalButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
  },
  journalItem: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  journalContent: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  journalDate: {
    marginBottom: spacing.sm,
    fontSize: 18,
  },
  promptText: {
    marginBottom: spacing.xs,
    fontSize: 14,
    opacity: 0.7,
  },
  virtuesText: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxxl,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: spacing.xxl,
    opacity: 0.7,
  },
});

