import '@/lib/unistyles';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevtoolsSections } from '@/components/settings/devtools-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { gameConfig } from '@/constants/gameConfig';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import {
  ensureNotificationPermissions,
  formatHourLabel,
  isWithinQuietHours,
} from '@/services/notificationManager';
import { borderRadius, journalStyles, spacing } from '@/utils/styles';

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

type HourStepperProps = {
  label: string;
  hour: number;
  onChange: (nextHour: number) => void;
};

/** Simple hour picker (no extra deps): step through 0–23, skipping quiet hours. */
function HourStepper({ label, hour, onChange }: HourStepperProps) {
  const step = (direction: 1 | -1) => {
    let next = hour;
    // Skip hours inside the quiet window; 24 iterations max guards against a full-quiet config.
    for (let i = 0; i < 24; i++) {
      next = (next + direction + 24) % 24;
      if (!isWithinQuietHours(next)) break;
    }
    onChange(next);
  };

  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceTextWrap}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
      </View>
      <View style={styles.hourStepper}>
        <TouchableOpacity style={styles.hourStepperButton} onPress={() => step(-1)}>
          <ThemedText type="defaultSemiBold">−</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.hourStepperValue}>{formatHourLabel(hour)}</ThemedText>
        <TouchableOpacity style={styles.hourStepperButton} onPress={() => step(1)}>
          <ThemedText type="defaultSemiBold">+</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, hydrated, setPreference } = useAppPreferences();

  const quietHours = gameConfig.notifications.quietHours;
  const quietHoursLabel = `${formatHourLabel(quietHours.startHour)}–${formatHourLabel(quietHours.endHour)}`;

  const handleReminderToggle = async (
    key: 'dailyReminderNotifications' | 'streakReminderNotifications',
    value: boolean
  ) => {
    if (value) {
      const allowed = await ensureNotificationPermissions();
      if (!allowed) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Garden of the Self in your system settings to receive reminders.'
        );
        return;
      }
    }
    setPreference(key, value);
  };

  const setHourPreference = (key: 'dailyReminderHour' | 'streakReminderHour', hour: number) => {
    setPreference(key, hour);
  };

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
            description="A daily nudge to tend your garden — mentions wilting plants and near level-ups."
            value={preferences.dailyReminderNotifications}
            onValueChange={(value) => handleReminderToggle('dailyReminderNotifications', value)}
          />
          {preferences.dailyReminderNotifications ? (
            <HourStepper
              label="Daily reminder time"
              hour={preferences.dailyReminderHour}
              onChange={(hour) => setHourPreference('dailyReminderHour', hour)}
            />
          ) : null}
          <PreferenceToggle
            label="Streak protection reminder"
            description="A later-in-the-day heads-up when no quest is done yet and your streak is at risk."
            value={preferences.streakReminderNotifications}
            onValueChange={(value) => handleReminderToggle('streakReminderNotifications', value)}
          />
          {preferences.streakReminderNotifications ? (
            <HourStepper
              label="Streak reminder time"
              hour={preferences.streakReminderHour}
              onChange={(hour) => setHourPreference('streakReminderHour', hour)}
            />
          ) : null}
          {preferences.dailyReminderNotifications || preferences.streakReminderNotifications ? (
            <ThemedText style={styles.quietHoursNote}>
              Quiet hours {quietHoursLabel} are always respected.
            </ThemedText>
          ) : null}
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
  hourStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hourStepperButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122, 122, 122, 0.45)',
  },
  hourStepperValue: {
    minWidth: 76,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  quietHoursNote: {
    opacity: 0.6,
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
