import '@/lib/unistyles';
import { PropsWithChildren } from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { StyleSheet, useUnistyles } from '@/lib/unistyles-compat';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';

type InfoModalProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  icon: IconSymbolName;
  title: string;
}>;

export function InfoModal({ visible, onClose, icon, title, children }: InfoModalProps) {
  const { theme } = useUnistyles();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <ThemedView style={styles.card}>
              <IconSymbol name={icon} size={32} color={theme.colors.tint} />
              <ThemedText type="subtitle" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText style={styles.body}>{children}</ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  card: {
    maxWidth: 320,
    width: '100%',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.selection,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  closeButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.selection,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: '600',
  },
}));
