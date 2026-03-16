import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { insertQuest } from '@/services/db';
import virtues from '@/constants/virtues';
import { useJournalStyles, spacing } from '@/utils/styles';

export default function CreateQuestScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [primaryVirtue, setPrimaryVirtue] = useState<string | null>(null);
  const [secondaryVirtue, setSecondaryVirtue] = useState<string | null>(null);
  const [tertiaryVirtue, setTertiaryVirtue] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const journalStyles = useJournalStyles();

  const handleCreate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      Alert.alert('Missing prompt', 'Enter a quest prompt.');
      return;
    }
    if (!primaryVirtue) {
      Alert.alert('Missing virtue', 'Select a primary virtue.');
      return;
    }
    try {
      setIsCreating(true);
      await insertQuest(trimmed, primaryVirtue, secondaryVirtue, tertiaryVirtue);
      router.back();
    } catch (error) {
      console.error('Failed to create quest:', error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderVirtueChip = (
    virtue: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={virtue}
      style={[
        styles.chip,
        journalStyles.border,
        selected && [journalStyles.button.primary, styles.chipSelected],
      ]}
      onPress={onPress}
    >
      <ThemedText
        style={selected ? journalStyles.button.primaryText : undefined}
        numberOfLines={1}
      >
        {virtue}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title" style={styles.title}>
          Add Quest
        </ThemedText>

        <ThemedText style={styles.label}>Prompt</ThemedText>
        <TextInput
          style={[styles.input, journalStyles.border]}
          placeholder="What will you do?"
          placeholderTextColor={journalStyles.colors.icon}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
        />

        <ThemedText style={styles.label}>Primary virtue (required)</ThemedText>
        <View style={styles.chipRow}>
          {virtues.map((v) =>
            renderVirtueChip(v, primaryVirtue === v, () =>
              setPrimaryVirtue(primaryVirtue === v ? null : v)
            )
          )}
        </View>

        <ThemedText style={styles.label}>Secondary virtue (optional)</ThemedText>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              journalStyles.border,
              secondaryVirtue === null && [
                journalStyles.button.primary,
                styles.chipSelected,
              ],
            ]}
            onPress={() => setSecondaryVirtue(null)}
          >
            <ThemedText
              style={secondaryVirtue === null ? journalStyles.button.primaryText : undefined}
            >
              None
            </ThemedText>
          </TouchableOpacity>
          {virtues.map((v) =>
            renderVirtueChip(v, secondaryVirtue === v, () =>
              setSecondaryVirtue(secondaryVirtue === v ? null : v)
            )
          )}
        </View>

        <ThemedText style={styles.label}>Tertiary virtue (optional)</ThemedText>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              journalStyles.border,
              tertiaryVirtue === null && [
                journalStyles.button.primary,
                styles.chipSelected,
              ],
            ]}
            onPress={() => setTertiaryVirtue(null)}
          >
            <ThemedText
              style={tertiaryVirtue === null ? journalStyles.button.primaryText : undefined}
            >
              None
            </ThemedText>
          </TouchableOpacity>
          {virtues.map((v) =>
            renderVirtueChip(v, tertiaryVirtue === v, () =>
              setTertiaryVirtue(tertiaryVirtue === v ? null : v)
            )
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[journalStyles.button.secondary, styles.buttonBase]}
            onPress={handleCancel}
            disabled={isCreating}
          >
            <ThemedText style={journalStyles.button.secondaryText}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              journalStyles.button.primary,
              styles.buttonBase,
              isCreating && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={journalStyles.button.primaryText}>
                Create Quest
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  input: {
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  chipSelected: {
    borderWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    width: '100%',
  },
  buttonBase: {
    flex: 1,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
});
