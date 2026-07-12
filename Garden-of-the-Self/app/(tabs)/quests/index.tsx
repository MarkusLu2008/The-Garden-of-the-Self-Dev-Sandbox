import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { useUnistyles } from '@/lib/unistyles-compat';
import {
  deleteQuest,
  getDailyQuests,
  getQuestDurationLabel,
  getQuestReflectionUsageMap,
  rerollDailyQuest,
  updateQuest,
  type QuestRow,
  type ScoringResult,
} from '@/services/db';
import { type QuestDifficultyTier } from '@/data/quests-seed';
import { getTodayDateString } from '@/utils/dateUtils';
import { borderRadius, journalStyles, spacing } from '@/utils/styles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function tierEmoji(tier: QuestDifficultyTier | null | undefined): string {
  if (tier === 'Gentle') return '🌱';
  if (tier === 'Moderate') return '⚡';
  if (tier === 'Stretch') return '🔥';
  return '⭐';
}

function dominantVirtueName(virtues: Record<string, number>): string {
  const entries = Object.entries(virtues).filter(([, v]) => v > 0);
  if (entries.length === 0) return '';
  entries.sort(([, a], [, b]) => b - a);
  return entries[0][0];
}

export default function QuestsScreen() {
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [questReflectionUsedMap, setQuestReflectionUsedMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { theme } = useUnistyles();
  const router = useRouter();
  const { preferences } = useAppPreferences();

  const loadQuests = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const today = getTodayDateString();
      const daily = await getDailyQuests(today);
      const reflectionUsage = await getQuestReflectionUsageMap(daily.map((quest) => quest.id));
      setQuests(daily);
      setQuestReflectionUsedMap(reflectionUsage);
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
      const scoringResult: ScoringResult | null = await updateQuest(quest.id, {
        completed: newCompleted,
        assignedDate: today,
      });
      if (newCompleted === 1 && scoringResult?.leveledUp) {
        Alert.alert(
          'Level Up!',
          `${scoringResult.dominantVirtue} reached ${scoringResult.newStageName} (Lv. ${scoringResult.newLevel})`
        );
      }
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

  const [rerollingId, setRerollingId] = useState<number | null>(null);

  const handleReroll = async (quest: QuestRow) => {
    if (!quest.difficulty_tier) {
      Alert.alert('Cannot reroll', 'This quest is missing a difficulty tier.');
      return;
    }
    const dominantVirtue = dominantVirtueName(quest.virtues);
    Alert.alert(
      'Reroll Quest?',
      `Swap this for another ${quest.difficulty_tier} quest for ${dominantVirtue || 'this virtue'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reroll',
          onPress: async () => {
            setRerollingId(quest.id);
            try {
              const replacement = await rerollDailyQuest(quest.id, getTodayDateString());
              if (!replacement) {
                Alert.alert(
                  'No replacement',
                  `No other ${quest.difficulty_tier} quest available for ${dominantVirtue || 'this virtue'}.`,
                );
                return;
              }
              setQuests((prev) => prev.map((q) => (q.id === quest.id ? replacement : q)));
            } catch (err) {
              console.error('Failed to reroll quest:', err);
              Alert.alert('Error', 'Failed to reroll quest');
            } finally {
              setRerollingId(null);
            }
          },
        },
      ],
    );
  };

  const renderQuestItem = ({ item }: { item: QuestRow }) => {
    const virtueRewardSummary = Object.entries(item.virtues)
      .filter(([, value]) => value > 0)
      .sort(([, left], [, right]) => right - left)
      .map(([name, value]) =>
        preferences.showQuestPointRewards ? `${name} +${value}` : name
      )
      .join(' · ');
    const questVirtuesParam = encodeURIComponent(JSON.stringify(item.virtues));
    const isReflectionUsed = questReflectionUsedMap[item.id] === true;
    const dominantVirtue = dominantVirtueName(item.virtues);
    const tierLabel = item.difficulty_tier ?? '—';
    const headingText = item.difficulty_tier
      ? `${tierEmoji(item.difficulty_tier)} ${tierLabel} · ${dominantVirtue}`
      : getQuestDurationLabel(item.duration);

    return (
      <ThemedView style={styles.questItemContainer}>
        <ThemedText type="subtitle" style={styles.durationHeading}>
          {headingText}
        </ThemedText>
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
              ⭐ {virtueRewardSummary}
            </ThemedText>
            {item.completed ? (
              <>
                <ThemedText style={styles.completedBadge}>Completed</ThemedText>
                <TouchableOpacity
                  style={[styles.reflectButton, isReflectionUsed ? styles.reflectButtonDisabled : null]}
                  onPress={(event) => {
                    event.stopPropagation();
                    if (isReflectionUsed) return;
                    router.push(
                      `/(tabs)/journals/create?sourceQuestId=${item.id}&sourceQuestPrompt=${encodeURIComponent(item.prompt)}&sourceQuestVirtues=${questVirtuesParam}`
                    );
                  }}
                  disabled={isReflectionUsed}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.reflectButtonText}>
                    {isReflectionUsed ? 'Reflection Logged' : 'Reflect in Journal'}
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.rerollButton}
                onPress={(event) => {
                  event.stopPropagation();
                  handleReroll(item);
                }}
                disabled={rerollingId === item.id}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.rerollButtonText}>
                  {rerollingId === item.id ? '🔄 Rerolling…' : '🔄 Reroll'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
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
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  questItemContainer: {
    marginBottom: spacing.lg,
  },
  durationHeading: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
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
  reflectButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(122, 162, 247, 0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122, 162, 247, 0.4)',
  },
  reflectButtonText: {
    fontSize: 13,
  },
  reflectButtonDisabled: {
    opacity: 0.45,
  },
  rerollButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(122, 162, 247, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122, 162, 247, 0.3)',
  },
  rerollButtonText: {
    fontSize: 13,
    opacity: 0.85,
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
