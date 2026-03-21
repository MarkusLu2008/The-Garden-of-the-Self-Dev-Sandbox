import '@/lib/unistyles';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevtoolsSections } from '@/components/settings/devtools-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { journalStyles, spacing } from '@/utils/styles';

type PreferenceToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
};

function PreferenceToggle({
  label,
  description,
  value,
  onValueChange,
}: PreferenceToggleProps) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceTextWrap}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        <ThemedText style={styles.preferenceDescription}>{description}</ThemedText>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, hydrated, setPreference } = useAppPreferences();

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your preferences and app behavior.
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedView style={styles.section}>
          <PreferenceToggle
            label="Show quest point rewards"
            description="Display point values on quest reward lines."
            value={preferences.showQuestPointRewards}
            onValueChange={(value) => setPreference('showQuestPointRewards', value)}
          />
          <PreferenceToggle
            label="Daily reminder notifications"
            description="Enable daily reminders for your reflection habit."
            value={preferences.dailyReminderNotifications}
            onValueChange={(value) => setPreference('dailyReminderNotifications', value)}
          />
          <PreferenceToggle
            label="Sound effects"
            description="Play subtle sounds for app feedback."
            value={preferences.soundEffectsEnabled}
            onValueChange={(value) => setPreference('soundEffectsEnabled', value)}
          />
          <PreferenceToggle
            label="Haptics and vibration"
            description="Use tactile feedback for supported interactions."
            value={preferences.hapticsEnabled}
            onValueChange={(value) => setPreference('hapticsEnabled', value)}
          />
          <PreferenceToggle
            label="Confirm before abandoning quest"
            description="Ask for confirmation before destructive quest actions."
            value={preferences.confirmBeforeAbandoningQuest}
            onValueChange={(value) => setPreference('confirmBeforeAbandoningQuest', value)}
          />
          {!hydrated ? (
            <ThemedText style={styles.hydrationText}>Loading saved preferences...</ThemedText>
          ) : null}
        </ThemedView>

        {__DEV__ ? (
          <>
            <ThemedView style={styles.devtoolsHeader}>
              <View style={styles.devtoolsDivider} />
              <ThemedText type="subtitle">Developer Tools</ThemedText>
              <ThemedText style={styles.devtoolsDescription}>
                Internal-only diagnostics and testing utilities.
              </ThemedText>
            </ThemedView>
            <DevtoolsSections />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    gap: spacing.md,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  preferenceTextWrap: {
    flex: 1,
  },
  preferenceDescription: {
    opacity: 0.75,
    marginTop: spacing.xs,
    fontSize: 13,
  },
  hydrationText: {
    opacity: 0.65,
    fontSize: 12,
  },
  devtoolsHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  devtoolsDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(122, 122, 122, 0.45)',
    marginBottom: spacing.sm,
  },
  devtoolsDescription: {
    opacity: 0.7,
    fontSize: 13,
  },
});
