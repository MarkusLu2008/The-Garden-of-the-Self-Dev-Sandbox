import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { gameConfig } from '@/constants/gameConfig';
import type { AppPreferences } from '@/contexts/AppPreferencesContext';
import { getAllVirtueProgress, getStreak, hasQuestCompletionOnDate } from '@/services/db';
import { getTodayDateString } from '@/utils/dateUtils';
import { levelProgress, virtueIsWilted } from '@/utils/questScoring';

/**
 * Local-notification reminders (no push, no backend). Everything is scheduled
 * on-device and re-synced whenever the app runs: contextual copy (wilting,
 * near level-up) is computed at sync time, and the streak-protection reminder
 * is a one-shot for later today that is cancelled once any quest is completed.
 */

const DAILY_REMINDER_ID = 'daily-reminder';
const STREAK_REMINDER_ID = 'streak-protect';
const ANDROID_CHANNEL_ID = 'reminders';

const MAX_LEVEL = gameConfig.quests.difficultyTiers.levelThresholds.length;

let handlerConfigured = false;

/** Show scheduled reminders even while the app is foregrounded. */
function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** True when the hour falls inside the configured quiet window (which may wrap midnight). */
export function isWithinQuietHours(hour: number): boolean {
  const { startHour, endHour } = gameConfig.notifications.quietHours;
  if (startHour === endHour) return false;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

/** Clamp an hour to the end of quiet hours so reminders never fire inside the window. */
export function clampOutsideQuietHours(hour: number): number {
  return isWithinQuietHours(hour) ? gameConfig.notifications.quietHours.endHour : hour;
}

export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized < 12 ? 'AM' : 'PM';
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${display}:00 ${suffix}`;
}

/**
 * Request OS notification permission if needed. Returns whether notifications
 * are allowed. Never re-prompts when the OS says we can't ask again.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}

type ReminderContent = { title: string; body: string };

/** Contextual daily-reminder copy: wilting plants win, then near level-up, then generic. */
async function buildDailyReminderContent(): Promise<ReminderContent> {
  const generic: ReminderContent = {
    title: 'Tend your garden 🌿',
    body: 'A small quest today keeps every virtue growing.',
  };
  try {
    const progress = await getAllVirtueProgress();
    const wilted = Object.entries(progress)
      .filter(([, row]) => row.spec_points > 0 && virtueIsWilted(row.last_activity_date))
      .map(([name]) => name);
    if (wilted.length > 0) {
      const others = wilted.length - 1;
      return {
        title: 'Your garden misses you 🥀',
        body:
          `${wilted[0]}${others > 0 ? ` and ${others} other plant${others > 1 ? 's' : ''}` : ''} ` +
          'is wilting — one quest starts the revival.',
      };
    }
    const near = Object.entries(progress).find(
      ([, row]) =>
        row.level < MAX_LEVEL &&
        levelProgress(row.spec_points) >= gameConfig.notifications.nearLevelUpProgress
    );
    if (near) {
      return {
        title: `${near[0]} is about to bloom 🌼`,
        body: 'You are close to a level-up — one more quest could do it.',
      };
    }
    return generic;
  } catch {
    return generic;
  }
}

async function buildStreakReminderContent(): Promise<ReminderContent> {
  try {
    const streak = await getStreak();
    if (streak.current_streak > 0) {
      return {
        title: `${streak.current_streak}-day streak on the line 🔥`,
        body:
          'No quest completed yet today. A single quest keeps the streak alive' +
          (streak.freezes_available > 0
            ? ` (${streak.freezes_available} freeze${streak.freezes_available > 1 ? 's' : ''} in reserve).`
            : '.'),
      };
    }
  } catch {
    // fall through to generic copy
  }
  return {
    title: 'Still time today 🌱',
    body: 'Complete one quest before the day ends to start a streak.',
  };
}

/**
 * Reconcile scheduled notifications with preferences and current app state.
 * Safe to call often (app foreground, preference change, quest completion):
 * it cancels our known identifiers and reschedules what should exist.
 * No-ops silently when permission is missing or the platform (e.g. Expo Go)
 * does not support scheduling.
 */
export async function syncNotifications(preferences: AppPreferences): Promise<void> {
  try {
    configureNotificationHandler();
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);

    const anyEnabled =
      preferences.dailyReminderNotifications || preferences.streakReminderNotifications;
    if (!anyEnabled) return;

    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    if (preferences.dailyReminderNotifications) {
      const hour = clampOutsideQuietHours(preferences.dailyReminderHour);
      const content = await buildDailyReminderContent();
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_REMINDER_ID,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    }

    if (preferences.streakReminderNotifications) {
      const hour = clampOutsideQuietHours(preferences.streakReminderHour);
      const doneToday = await hasQuestCompletionOnDate(getTodayDateString());
      const fireDate = new Date();
      fireDate.setHours(hour, 0, 0, 0);
      if (!doneToday && fireDate.getTime() > Date.now()) {
        const content = await buildStreakReminderContent();
        await Notifications.scheduleNotificationAsync({
          identifier: STREAK_REMINDER_ID,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: ANDROID_CHANNEL_ID,
          },
        });
      }
    }
  } catch (error) {
    console.warn('Notification sync failed', error);
  }
}
