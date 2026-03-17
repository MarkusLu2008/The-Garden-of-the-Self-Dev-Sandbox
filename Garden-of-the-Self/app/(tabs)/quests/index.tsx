import { useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  getAllQuests,
  updateQuest,
  deleteQuest,
  getQuestVirtueDisplayNames,
  type QuestRow,
} from '@/services/db';
import { useUnistyles } from 'react-native-unistyles';
import { journalStyles, spacing, borderRadius } from '@/utils/styles';

export default function QuestsScreen() {
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useUnistyles();

  const loadQuests = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const all = await getAllQuests();
      setQuests(all);
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

  const handleAddQuest = () => {
    router.push('/(tabs)/quests/create');
  };

  const handleToggleCompleted = async (quest: QuestRow) => {
    try {
      await updateQuest(quest.id, { completed: quest.completed ? 0 : 1 });
      loadQuests(false);
    } catch (error) {
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
              loadQuests(false);
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
            numberOfLines={2}
          >
            {item.prompt}
          </ThemedText>
          <ThemedText style={styles.virtuesText} numberOfLines={1}>
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
        Add a quest to grow your virtues
      </ThemedText>
      <TouchableOpacity style={journalStyles.buttonPrimary} onPress={handleAddQuest}>
        <ThemedText style={journalStyles.buttonPrimaryText}>Add Quest</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Quests
        </ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddQuest}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="plus.circle.fill"
            size={28}
            color={theme.colors.tint}
          />
        </TouchableOpacity>
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
  addButton: {
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
