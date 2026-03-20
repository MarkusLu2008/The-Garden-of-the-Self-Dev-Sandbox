import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'onboarding:completed';

type OnboardingContextType = {
  hasCompletedOnboarding: boolean | null; // null = loading
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType>({
  hasCompletedOnboarding: null,
  completeOnboarding: () => {},
  resetOnboarding: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setHasCompletedOnboarding(value === 'true');
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    AsyncStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const resetOnboarding = useCallback(() => {
    setHasCompletedOnboarding(false);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}
