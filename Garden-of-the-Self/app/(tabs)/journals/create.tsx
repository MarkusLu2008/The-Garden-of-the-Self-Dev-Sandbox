import '@/lib/unistyles';
import { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StyleSheet, useUnistyles } from '@/lib/unistyles-compat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { canAwardJournalPointsToday, createJournal } from '@/services/journalManager';
import { generateJournalId } from '@/utils/dateUtils';
import { journalStyles, spacing } from '@/utils/styles';
import virtues from '@/constants/virtues';
import { gameConfig } from '@/constants/gameConfig';
import { distributeJournalVirtuePoints } from '@/utils/virtuePoints';
import type { QuestVirtueValues } from '@/services/db';

function decodeParam(value: string | undefined): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseSourceQuestVirtues(rawValue: string | undefined): QuestVirtueValues {
  if (!rawValue) return {};

  try {
    const decoded = decodeParam(rawValue);
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    const values: QuestVirtueValues = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        values[name] = value;
      }
    }
    return values;
  } catch {
    return {};
  }
}

export default function CreateJournalModal() {
  const router = useRouter();
  const { sourceQuestId, sourceQuestPrompt, sourceQuestVirtues } = useLocalSearchParams<{
    sourceQuestId?: string;
    sourceQuestPrompt?: string;
    sourceQuestVirtues?: string;
  }>();
  const { theme } = useUnistyles();
  const [isCreating, setIsCreating] = useState(false);
  const [intention, setIntention] = useState('');
  const [selectedVirtues, setSelectedVirtues] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [canPreviewPoints, setCanPreviewPoints] = useState<boolean | null>(null);
  const sourcePrompt = decodeParam(sourceQuestPrompt);
  const sourceVirtues = parseSourceQuestVirtues(sourceQuestVirtues);

  useEffect(() => {
    let isMounted = true;

    const loadCanPreviewPoints = async () => {
      try {
        const canAward = await canAwardJournalPointsToday();
        if (isMounted) {
          setCanPreviewPoints(canAward);
        }
      } catch (error) {
        console.error('Failed to check journal point eligibility:', error);
      }
    };

    loadCanPreviewPoints();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sourcePrompt && Object.keys(sourceVirtues).length === 0) {
      return;
    }

    if (!intention.trim() && sourcePrompt) {
      setIntention(`Reflecting on quest: ${sourcePrompt}`);
    }

    if (selectedVirtues.length === 0) {
      const questVirtueNames = Object.entries(sourceVirtues)
        .filter(([, value]) => value > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name]) => name)
        .slice(0, gameConfig.journal.maxVirtuesPerEntry);

      if (questVirtueNames.length > 0) {
        setSelectedVirtues(questVirtueNames);
      }
    }
  }, [sourcePrompt, sourceVirtues, intention, selectedVirtues.length]);

  const toggleVirtue = (virtue: string) => {
    setValidationError(null);
    setSelectedVirtues((current) => {
      const isSelected = current.includes(virtue);
      if (isSelected) {
        return current.filter((v) => v !== virtue);
      }
      if (current.length >= gameConfig.journal.maxVirtuesPerEntry) {
        return current;
      }
      return [...current, virtue];
    });
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      if (selectedVirtues.length === 0) {
        setValidationError('Please select at least one virtue.');
        setIsCreating(false);
        return;
      }
      
      // Generate a unique journal ID (format: YYYY-MM-DD-HHMMSS)
      const journalId = generateJournalId();

      const virtueValues = distributeJournalVirtuePoints(
        selectedVirtues,
        gameConfig.journal.totalPointsPerEntry
      );

      const sourceQuestIdValue =
        typeof sourceQuestId === 'string' && sourceQuestId.length > 0
          ? Number.parseInt(sourceQuestId, 10)
          : null;

      await createJournal(journalId, intention, virtueValues, {
        sourceQuestId:
          sourceQuestIdValue != null && Number.isFinite(sourceQuestIdValue)
            ? sourceQuestIdValue
            : undefined,
        sourceQuestVirtues:
          Object.keys(sourceVirtues).length > 0 ? sourceVirtues : undefined,
      });
      
      // Navigate to the editor
      const sourcePromptParam = sourcePrompt ? `&sourceQuestPrompt=${encodeURIComponent(sourcePrompt)}` : '';
      const sourceQuestIdParam =
        sourceQuestIdValue != null && Number.isFinite(sourceQuestIdValue)
          ? `&sourceQuestId=${sourceQuestIdValue}`
          : '';
      const editorPath = `/(tabs)/journals/editor?date=${journalId}${sourceQuestIdParam}${sourcePromptParam}` as Href;
      // Normalize stack so Editor "Back" returns to Journals list.
      router.replace('/(tabs)/journals');
      setTimeout(() => {
        router.push(editorPath);
      }, 0);
    } catch (error) {
      console.error('Failed to create journal:', error);
      Alert.alert('Error', 'Failed to create journal. Please try again.');
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const hasVirtueSelection = selectedVirtues.length > 0;
  const previewValues = hasVirtueSelection
    ? distributeJournalVirtuePoints(selectedVirtues, gameConfig.journal.totalPointsPerEntry)
    : null;

  return (
    <SafeAreaView style={journalStyles.container} edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Create New Journal
          </ThemedText>
          <ThemedText style={styles.description}>
            Set your intention and choose which virtues this entry will cultivate.{' '}
            Your first journal entry each day awards {gameConfig.journal.totalPointsPerEntry}{' '}
            points shared across your selected virtues.
          </ThemedText>

          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Intention (optional)
            </ThemedText>
            <TextInput
              style={styles.intentionInput}
              value={intention}
              onChangeText={setIntention}
              placeholder="What is your intention for this journal entry?"
              placeholderTextColor={theme.colors.icon}
              multiline
              blurOnSubmit
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Virtues
            </ThemedText>
            <ThemedText style={styles.helperText}>
              Select up to {gameConfig.journal.maxVirtuesPerEntry} virtues. A total of{' '}
              {gameConfig.journal.totalPointsPerEntry} points from your first journal entry
              each day will be distributed as evenly as possible between your selections.
            </ThemedText>
            <View style={styles.virtuesContainer}>
              {virtues.map((virtue) => {
                const selected = selectedVirtues.includes(virtue);
                return (
                  <TouchableOpacity
                    key={virtue}
                    style={[
                      styles.virtueChip,
                      selected && styles.virtueChipSelected,
                    ]}
                    onPress={() => toggleVirtue(virtue)}
                    disabled={isCreating}
                  >
                    <ThemedText
                      style={[
                        styles.virtueChipText,
                        selected && styles.virtueChipTextSelected,
                      ]}
                    >
                      {virtue}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            {hasVirtueSelection && previewValues && canPreviewPoints === true && (
              <ThemedText style={styles.previewText}>
                First-entry daily points preview:{' '}
                {selectedVirtues
                  .map((name) => `${name}: ${previewValues[name] ?? 0}`)
                  .join(', ')}
              </ThemedText>
            )}
            {validationError && (
              <ThemedText style={styles.errorText}>{validationError}</ThemedText>
            )}
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[journalStyles.buttonSecondary, styles.buttonBase]}
              onPress={handleCancel}
              disabled={isCreating}
            >
              <ThemedText style={journalStyles.buttonSecondaryText}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                journalStyles.buttonPrimary,
                styles.buttonBase,
                isCreating && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={theme.colors.background} />
              ) : (
                <ThemedText style={journalStyles.buttonPrimaryText}>
                  Create
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
          </ThemedView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = (StyleSheet as any).create((theme: any) => ({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    opacity: 0.7,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  section: {
    width: '100%',
    maxWidth: 500,
    marginTop: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  intentionInput: {
    borderWidth: 1,
    borderColor: theme.colors.selection,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.sm,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  virtuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  virtueChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  virtueChipSelected: {
    backgroundColor: theme.colors.tint,
    borderColor: theme.colors.tint,
  },
  virtueChipText: {
    fontSize: 14,
  },
  virtueChipTextSelected: {
    color: theme.colors.background,
  },
  previewText: {
    marginTop: spacing.sm,
    fontSize: 13,
    opacity: 0.8,
  },
  errorText: {
    marginTop: spacing.xs,
    color: theme.colors.error,
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  buttonBase: {
    flex: 1,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
}));
