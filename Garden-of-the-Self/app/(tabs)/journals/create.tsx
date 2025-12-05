import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createJournal } from '@/services/journalManager';
import { generateJournalId } from '@/utils/dateUtils';
import { useJournalStyles, spacing } from '@/utils/styles';

export default function CreateJournalModal() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const journalStyles = useJournalStyles();

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      
      // Generate a unique journal ID (format: YYYY-MM-DD-HHMMSS)
      const journalId = generateJournalId();
      
      // Create the journal entry (with empty prompt and virtues for now)
      await createJournal(journalId, '', '');
      
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

  return (
    <SafeAreaView style={journalStyles.container} edges={['top', 'bottom']}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Create New Journal
        </ThemedText>
        <ThemedText style={styles.description}>
          Create a new journal entry. You can create multiple entries per day.
        </ThemedText>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[journalStyles.button.secondary, styles.buttonBase]} 
            onPress={handleCancel}
            disabled={isCreating}
          >
            <ThemedText style={journalStyles.button.secondaryText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              journalStyles.button.primary, 
              styles.buttonBase,
              isCreating && styles.createButtonDisabled
            ]} 
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={journalStyles.button.primaryText}>Create</ThemedText>
            )}
          </TouchableOpacity>
        </View>
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
    gap: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    opacity: 0.7,
    marginBottom: spacing.xxl,
    textAlign: 'center',
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
});
