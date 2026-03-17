import '@/lib/unistyles';
import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createJournal } from '@/services/journalManager';
import { generateJournalId } from '@/utils/dateUtils';
import { journalStyles, spacing } from '@/utils/styles';
import virtues from '@/constants/virtues';
import { distributeJournalVirtuePoints } from '@/utils/virtuePoints';

export default function CreateJournalModal() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [isCreating, setIsCreating] = useState(false);
  const [intention, setIntention] = useState('');
  const [selectedVirtues, setSelectedVirtues] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const toggleVirtue = (virtue: string) => {
    setValidationError(null);
    setSelectedVirtues((current) => {
      const isSelected = current.includes(virtue);
      if (isSelected) {
        return current.filter((v) => v !== virtue);
      }
      if (current.length >= 5) {
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

      const virtueValues = distributeJournalVirtuePoints(selectedVirtues, 5);

      await createJournal(journalId, intention, virtueValues);
      
      // Navigate to the editor
      router.replace(`/(tabs)/journals/editor?date=${journalId}`);
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
    ? distributeJournalVirtuePoints(selectedVirtues, 5)
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
            Set your intention and choose which virtues this entry will cultivate. Five points will be shared across your selected virtues.
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
              Select up to 5 virtues. A total of 5 points will be distributed as evenly as possible between your selections.
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
            {hasVirtueSelection && previewValues && (
              <ThemedText style={styles.previewText}>
                Points preview:{' '}
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

const styles = StyleSheet.create((theme) => ({
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
