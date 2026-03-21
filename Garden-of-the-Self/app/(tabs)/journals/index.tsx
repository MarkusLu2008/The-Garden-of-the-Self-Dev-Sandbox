import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useUnistyles } from '@/lib/unistyles-compat';
import type { JournalVirtueValues } from '@/services/db';
import { deleteJournal, getAllJournals } from '@/services/journalManager';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { borderRadius, journalStyles, spacing } from '@/utils/styles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type JournalItem = {
  id: number;
  file_path: string;
  prompt: string | null;
  virtues: JournalVirtueValues;
  created_at: string;
  updated_at: string;
};

export default function JournalsScreen() {
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deletingFilePath, setDeletingFilePath] = useState<string | null>(null);
  const rowDeleteAnimationsRef = useRef<Record<string, Animated.Value>>({});
  const router = useRouter();
  const { theme } = useUnistyles();

  const getRowDeleteAnimation = useCallback((filePath: string) => {
    if (!rowDeleteAnimationsRef.current[filePath]) {
      rowDeleteAnimationsRef.current[filePath] = new Animated.Value(0);
    }

    return rowDeleteAnimationsRef.current[filePath];
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      loadJournals();
    }, [])
  );

  const handleNewJournal = () => {
    router.push('/(tabs)/journals/create');
  };

  const handleJournalPress = (file_path: string) => {
    router.push(`/(tabs)/journals/editor?date=${file_path}`);
  };

  const handleDeleteJournal = (journal: JournalItem) => {
    const promptText = typeof journal.prompt === 'string' ? journal.prompt.trim() : '';
    const promptPreview =
      promptText.length > 50 ? `${promptText.slice(0, 50)}...` : promptText;
    const message = promptPreview
      ? `Delete journal for ${formatDateForDisplay(journal.file_path)}?\n\n"${promptPreview}"`
      : `Delete journal for ${formatDateForDisplay(journal.file_path)}?`;

    Alert.alert('Delete Journal', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (deletingFilePath) return;
          try {
            const rowAnimation = getRowDeleteAnimation(journal.file_path);
            setDeletingFilePath(journal.file_path);
            await new Promise<void>((resolve) => {
              Animated.timing(rowAnimation, {
                toValue: 1,
                duration: 320,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }).start(() => resolve());
            });

            await deleteJournal(journal.file_path);
            setJournals((prev) => prev.filter((item) => item.file_path !== journal.file_path));
            delete rowDeleteAnimationsRef.current[journal.file_path];
          } catch (error) {
            console.error('Failed to delete journal:', error);
            const rowAnimation = rowDeleteAnimationsRef.current[journal.file_path];
            if (rowAnimation) {
              Animated.timing(rowAnimation, {
                toValue: 0,
                duration: 180,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            }
            Alert.alert('Error', 'Failed to delete journal');
          } finally {
            setDeletingFilePath(null);
          }
        },
      },
    ]);
  };

  const renderJournalItem = ({ item }: { item: JournalItem }) => {
    const promptText = typeof item.prompt === 'string' ? item.prompt : '';
    const virtueNames =
      item.virtues && typeof item.virtues === 'object'
        ? Object.entries(item.virtues)
            .filter(([, value]) => typeof value === 'number' && value > 0)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([name]) => name)
        : [];
    const virtuesText = virtueNames.join(', ');
    const rowDeleteAnimation = getRowDeleteAnimation(item.file_path);
    const animatedRowStyle = {
      opacity: rowDeleteAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      transform: [
        {
          translateX: rowDeleteAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 90],
          }),
        },
        {
          scale: rowDeleteAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.92],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.journalItem, animatedRowStyle]}>
        <TouchableOpacity
          onPress={() => {
            if (!isDeleteMode) {
              handleJournalPress(item.file_path);
            }
          }}
          activeOpacity={0.7}
        >
          <ThemedView style={[journalStyles.border, styles.journalContent]}>
            <ThemedView style={styles.dateRow}>
              <ThemedText type="defaultSemiBold" style={styles.journalDate}>
                {formatDateForDisplay(item.file_path)}
              </ThemedText>
              {isDeleteMode ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteJournal(item)}
                  disabled={deletingFilePath === item.file_path}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.deleteButtonText}>
                    {deletingFilePath === item.file_path ? 'Deleting...' : 'Delete'}
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
            </ThemedView>
            {promptText ? (
              <ThemedText style={styles.promptText}>
                💭 {promptText}
              </ThemedText>
            ) : null}
            {virtuesText ? (
              <ThemedText style={styles.virtuesText}>
                ⭐ {virtuesText}
              </ThemedText>
            ) : null}
          </ThemedView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <IconSymbol name="book.fill" size={64} color={theme.colors.icon} style={styles.emptyIcon} />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No journals yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Start your journey by creating your first journal entry
      </ThemedText>
      <TouchableOpacity style={journalStyles.buttonPrimary} onPress={handleNewJournal}>
        <ThemedText style={journalStyles.buttonPrimaryText}>Create First Journal</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Journals
        </ThemedText>
        <ThemedView style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteModeButton}
            onPress={() => setIsDeleteMode((prev) => !prev)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.deleteModeButtonText}>
              {isDeleteMode ? 'Done' : 'Delete'}
            </ThemedText>
          </TouchableOpacity>
          {!isDeleteMode ? (
            <TouchableOpacity
              style={styles.newJournalButton}
              onPress={handleNewJournal}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus.circle.fill" size={28} color={theme.colors.tint} />
            </TouchableOpacity>
          ) : null}
        </ThemedView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteModeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteModeButtonText: {
    color: '#ef4444',
    fontSize: 16,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  journalDate: {
    fontSize: 18,
    flex: 1,
    paddingRight: spacing.sm,
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
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

