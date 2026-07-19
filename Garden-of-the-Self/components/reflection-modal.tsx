import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUnistyles } from '@/lib/unistyles-compat';
import { borderRadius, spacing } from '@/utils/styles';

const MAX_REFLECTION_LENGTH = 280;

export type ReflectionModalProps = {
  visible: boolean;
  /** Rotating prompt shown above the textbox. */
  prompt: string;
  /** Prompt of the quest just completed, shown small for context. */
  questPrompt: string;
  onSave: (text: string) => void;
  onSkip: () => void;
};

/**
 * Optional short reflection after completing a quest (Phase 9). Entirely
 * skippable — one tap dismisses it. Separate from the free-form journal.
 */
export function ReflectionModal({ visible, prompt, questPrompt, onSave, onSkip }: ReflectionModalProps) {
  const [text, setText] = useState('');
  const { theme } = useUnistyles();

  const close = (save: boolean) => {
    const trimmed = text.trim();
    setText('');
    if (save && trimmed.length > 0) {
      onSave(trimmed);
    } else {
      onSkip();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => close(false)}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Quest complete 🌱</ThemedText>
          <ThemedText style={styles.questPrompt} numberOfLines={2}>
            {questPrompt}
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.reflectionPrompt}>
            {prompt}
          </ThemedText>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.icon }]}
            value={text}
            onChangeText={setText}
            placeholder="A sentence or two — just for you."
            placeholderTextColor={theme.colors.icon}
            multiline
            maxLength={MAX_REFLECTION_LENGTH}
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={() => close(false)}>
              <ThemedText style={styles.skipText}>Skip</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.tint }]}
              onPress={() => close(true)}
              disabled={text.trim().length === 0}
            >
              <ThemedText style={[styles.saveText, { color: theme.colors.background }]}>
                Save reflection
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  questPrompt: {
    fontSize: 13,
    opacity: 0.6,
  },
  reflectionPrompt: {
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    opacity: 0.7,
  },
  saveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  saveText: {
    fontWeight: '600',
  },
});
