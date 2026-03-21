import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUnistyles } from '@/lib/unistyles-compat';
import { ThemedText } from '@/components/themed-text';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { onboardingPages } from './onboarding-content';
import { OnboardingPage } from './OnboardingPage';

const isWeb = Platform.OS === 'web';

export function OnboardingPager() {
  const { theme } = useUnistyles();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [pageIndex, setPageIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === onboardingPages.length - 1;

  function dismiss() {
    completeOnboarding();
    router.back();
  }

  function goBack() {
    if (!isWeb && pagerRef.current) {
      pagerRef.current.setPage(pageIndex - 1);
    }
  }

  const dots = (
    <View style={styles.dots}>
      {onboardingPages.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i === pageIndex ? theme.colors.tint : theme.colors.selection,
            },
          ]}
        />
      ))}
    </View>
  );

  const bottomButton = (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.colors.tint }]}
      onPress={isLastPage ? dismiss : () => {
        if (!isWeb && pagerRef.current) {
          pagerRef.current.setPage(pageIndex + 1);
        }
      }}
      activeOpacity={0.8}
    >
      <ThemedText
        type="defaultSemiBold"
        style={[styles.buttonText, { color: isWeb ? '#fff' : theme.colors.background }]}
      >
        {isLastPage ? 'Get Started' : 'Next'}
      </ThemedText>
    </TouchableOpacity>
  );

  const header = (
    <View style={styles.header}>
      {!isFirstPage ? (
        <TouchableOpacity style={styles.headerButton} onPress={goBack}>
          <ThemedText style={styles.skipText}>Back</ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
      {!isLastPage ? (
        <TouchableOpacity style={styles.headerButton} onPress={dismiss}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );

  if (isWeb) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        {header}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / (windowWidth || 1)
            );
            setPageIndex(Math.min(index, onboardingPages.length - 1));
          }}
          style={styles.pager}
        >
          {onboardingPages.map((page, i) => (
            <OnboardingPage key={i} page={page} width={windowWidth} />
          ))}
        </ScrollView>
        {dots}
        {bottomButton}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {header}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPageIndex(e.nativeEvent.position)}
      >
        {onboardingPages.map((page, i) => (
          <OnboardingPage key={i} page={page} width={windowWidth} />
        ))}
      </PagerView>
      {dots}
      {bottomButton}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    opacity: 0.7,
  },
  pager: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    marginHorizontal: 32,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
  },
});
