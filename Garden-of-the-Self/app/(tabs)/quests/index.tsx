import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useUnistyles } from '@/lib/unistyles-compat';
import {
  deleteQuest,
  getDailyQuests,
  getQuestVirtueDisplayNames,
  updateQuest,
  type QuestRow,
} from '@/services/db';
import { getTodayDateString } from '@/utils/dateUtils';
import { borderRadius, journalStyles, spacing } from '@/utils/styles';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuestsScreen() {
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useUnistyles();

  const loadQuests = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const today = getTodayDateString();
      const daily = await getDailyQuests(today);
      setQuests(daily);
    } catch (error) {
      console.error('Failed to load quests:', error);
      Alert.alert('Error', 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only show full-screen loader when we have no data yet (initial load)
      loadQuests(quests.length === 0);
    }, [loadQuests, quests.length])
  );

  const handleToggleCompleted = async (quest: QuestRow) => {
    const newCompleted = quest.completed ? 0 : 1;
    const today = getTodayDateString();
    // Optimistically update local state so the list stays fixed
    setQuests((prev) =>
      prev.map((q) => (q.id === quest.id ? { ...q, completed: newCompleted } : q))
    );
    try {
      await updateQuest(quest.id, { completed: newCompleted, assignedDate: today });
    } catch (error) {
      // Revert on failure
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, completed: quest.completed } : q))
      );
      console.error('Failed to toggle quest:', error);
      Alert.alert('Error', 'Failed to update quest');
    }
  };

  const handleDelete = (quest: QuestRow) => {
    Alert.alert(
      'Delete Quest',
      `Delete "${quest.prompt.slice(0, 50)}${quest.prompt.length > 50 ? '…' : ''}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuest(quest.id);
              setQuests((prev) => prev.filter((q) => q.id !== quest.id));
            } catch (error) {
              console.error('Failed to delete quest:', error);
              Alert.alert('Error', 'Failed to delete quest');
            }
          },
        },
      ]
    );
  };

  const renderQuestItem = ({ item }: { item: QuestRow }) => {
    const virtueNames = getQuestVirtueDisplayNames(item).join(' · ');

    return (
      <TouchableOpacity
        style={styles.questItem}
        onPress={() => handleToggleCompleted(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <ThemedView style={[journalStyles.border, styles.questContent]}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.questPrompt, item.completed ? styles.completedText : null]}
          >
            {item.prompt}
          </ThemedText>
          <ThemedText style={styles.virtuesText}>
            ⭐ {virtueNames}
          </ThemedText>
          {item.completed ? (
            <ThemedText style={styles.completedBadge}>Completed</ThemedText>
          ) : null}
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <IconSymbol
        name="flag.checkered"
        size={64}
        color={theme.colors.icon}
        style={styles.emptyIcon}
      />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No quests yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        No quests for today
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Daily Quests
        </ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      ) : quests.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={quests}
          renderItem={renderQuestItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={() => loadQuests(false)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
  },
  questItem: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  questContent: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  questPrompt: {
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  virtuesText: {
    fontSize: 14,
    opacity: 0.7,
  },
  completedBadge: {
    marginTop: spacing.sm,
    fontSize: 12,
    opacity: 0.6,
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
