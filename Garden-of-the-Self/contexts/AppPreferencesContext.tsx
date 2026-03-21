import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app:preferences:v1';

export type AppPreferences = {
  showQuestPointRewards: boolean;
  dailyReminderNotifications: boolean;
  soundEffectsEnabled: boolean;
  hapticsEnabled: boolean;
  confirmBeforeAbandoningQuest: boolean;
};

const DEFAULT_PREFERENCES: AppPreferences = {
  showQuestPointRewards: true,
  dailyReminderNotifications: false,
  soundEffectsEnabled: true,
  hapticsEnabled: true,
  confirmBeforeAbandoningQuest: true,
};

type AppPreferencesContextType = {
  preferences: AppPreferences;
  hydrated: boolean;
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextType>({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
  setPreference: () => {},
});

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || cancelled) return;

        const parsed = JSON.parse(raw) as Partial<AppPreferences>;
        setPreferences((current) => ({
          ...current,
          ...parsed,
        }));
      } catch (error) {
        console.warn('Failed to load app preferences', error);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(
    <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
          console.warn('Failed to persist app preferences', error);
        });
        return next;
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      preferences,
      hydrated,
      setPreference,
    }),
    [preferences, hydrated, setPreference]
  );

  return (
    <AppPreferencesContext.Provider value={contextValue}>
      {children}
    </AppPreferencesContext.Provider>
  );
}
