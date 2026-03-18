import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDateOverride } from '@/utils/dateUtils';

const STORAGE_KEY = 'dev:dateOverride';

type DateOverrideContextType = {
  overrideDate: string | null; // YYYY-MM-DD or null
  setOverrideDate: (date: string | null) => void;
};

const DateOverrideContext = createContext<DateOverrideContextType>({
  overrideDate: null,
  setOverrideDate: () => {},
});

export function useDateOverride() {
  return useContext(DateOverrideContext);
}

export function DateOverrideProvider({ children }: { children: ReactNode }) {
  const [overrideDate, setOverrideDateState] = useState<string | null>(null);

  // Load persisted override on mount
  useEffect(() => {
    if (!__DEV__) return;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        applyOverride(value);
      }
    });
  }, []);

  function applyOverride(dateStr: string | null) {
    setOverrideDateState(dateStr);
    if (dateStr) {
      // Parse as noon to avoid timezone edge cases
      setDateOverride(new Date(`${dateStr}T12:00:00`));
    } else {
      setDateOverride(null);
    }
  }

  const setOverrideDate = useCallback((date: string | null) => {
    if (!__DEV__) return;
    applyOverride(date);
    if (date) {
      AsyncStorage.setItem(STORAGE_KEY, date);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <DateOverrideContext.Provider value={{ overrideDate, setOverrideDate }}>
      {children}
    </DateOverrideContext.Provider>
  );
}
