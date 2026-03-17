import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUnistyles } from '@/lib/unistyles-compat';
import { journalStyles, spacing } from '@/utils/styles';
import { Fonts } from '@/constants/theme';
import { getVirtueTotals } from '@/services/db';
import { useFocusEffect } from 'expo-router';
import virtues from '@/constants/virtues';
import { VIRTUE_TREE_IMAGES, treeScoreToStage } from '@/constants/virtueTreeImages';

const LINES = 10;
const WIDTH = 20;
const STAGE_THRESHOLD = 25;

// Pine: 5 stages from seed → full tree (tip and trunk centered)
const PINE_STAGES: string[] = [
  `         .
         |
        ( )`,
  `         .
       / \\
      |   |
       \\ /
        |`,
  `   /\\
     /  \\
    /    \\
   /  ||  \\`,
  `   /\\
     /  \\
    /    \\
   /______\\
     |||
     |||`,
  ` /\\
   /  \\
   /    \\
   /______\\
  /________\\
     |||
     |||
     |||`,
];

function scoreToStage(score: number, stageCount: number): number {
  if (score <= 0) return 0;
  return Math.min(Math.floor(score / STAGE_THRESHOLD), stageCount - 1);
}

function padStage(art: string): string {
  const lines = art.replace(/^\n+|\n+$/g, '').split('\n');
  const w = Math.max(WIDTH, ...lines.map((l) => l.length));
  const padded = lines.map((l) => {
    const left = Math.floor((w - l.length) / 2);
    const right = w - l.length - left;
    return ' '.repeat(left) + l + ' '.repeat(right);
  });
  while (padded.length < LINES) {
    padded.unshift(' '.repeat(w));
  }
  return padded.slice(0, LINES).join('\n');
}

function useBreathingAnimation() {
  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [breathe]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));
  return animatedStyle;
}

type VirtueGardenPageProps = {
  virtueName: string;
  score: number;
  textColor: string;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
};

function VirtueGardenPage({
  virtueName,
  score,
  textColor,
  animatedStyle,
}: VirtueGardenPageProps) {
  const treeImages = VIRTUE_TREE_IMAGES[virtueName];
  const hasTreeImages = treeImages != null && treeImages.length > 0;
  const treeStage = hasTreeImages ? treeScoreToStage(score, treeImages.length) : 0;
  const pineStage = scoreToStage(score, PINE_STAGES.length);
  const displayArt = padStage(PINE_STAGES[pineStage]);

  return (
    <View style={styles.page}>
      <ThemedText type="subtitle" style={styles.virtueName}>
        {virtueName}
      </ThemedText>
      <ThemedText style={styles.scoreText}>
        {virtueName} points: {score}
      </ThemedText>
      <Animated.View
        style={[styles.asciiWrapper, animatedStyle] as React.ComponentProps<typeof Animated.View>['style']}
      >
        {hasTreeImages ? (
          <Image
            source={treeImages[treeStage]}
            style={styles.treeImage}
            contentFit="contain"
          />
        ) : (
          <Text
            style={[styles.asciiArt, { color: textColor }]}
            selectable={false}
          >
            {displayArt}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

export default function GardenScreen() {
  const { theme } = useUnistyles();
  const textColor = theme.colors.text;
  const { width: windowWidth } = useWindowDimensions();

  const [virtueTotals, setVirtueTotals] = useState<Record<string, number> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const breathingStyle = useBreathingAnimation();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const totals = await getVirtueTotals();
          if (!cancelled) setVirtueTotals(totals);
        } catch (e) {
          console.warn('Failed to load virtue totals', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const totals = virtueTotals ?? {};

  const pageContent = (
    <>
      <ThemedText type="title" style={styles.title}>
        Your Garden
      </ThemedText>
      <ThemedText style={styles.pageIndicator}>
        {pageIndex + 1} / {virtues.length}
      </ThemedText>
    </>
  );

  if (isWeb) {
    return (
      <SafeAreaView style={journalStyles.container} edges={['top']}>
        <ThemedView style={styles.content}>
          {pageContent}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / (windowWidth || 1)
              );
              setPageIndex(Math.min(index, virtues.length - 1));
            }}
            style={styles.webScroll}
            contentContainerStyle={styles.webScrollContent}
          >
            {virtues.map((virtueName) => (
              <View key={virtueName} style={[styles.webPage, { width: windowWidth }]}>
                <VirtueGardenPage
                  virtueName={virtueName}
                  score={totals[virtueName] ?? 0}
                  textColor={textColor}
                  animatedStyle={breathingStyle}
                />
              </View>
            ))}
          </ScrollView>
          <ThemedText style={styles.subtitle}>
            Complete quests to grow your virtues. Your garden will flourish as
            you tend to it through journaling and reflection.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        {pageContent}
      </ThemedView>
      <PagerView
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPageIndex(e.nativeEvent.position)}
      >
        {virtues.map((virtueName) => (
          <View key={virtueName} style={styles.pagerPage}>
            <VirtueGardenPage
              virtueName={virtueName}
              score={totals[virtueName] ?? 0}
              textColor={textColor}
              animatedStyle={breathingStyle}
            />
          </View>
        ))}
      </PagerView>
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.subtitle}>
          Complete quests to grow your virtues. Your garden will flourish as you
          tend to it through journaling and reflection.
        </ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pageIndicator: {
    marginBottom: spacing.md,
    fontSize: 14,
    opacity: 0.8,
  },
  pager: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  virtueName: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scoreText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  asciiWrapper: {
    marginVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  treeImage: {
    width: 240,
    height: 280,
  },
  asciiArt: {
    fontFamily: Fonts?.mono ?? 'monospace',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  webScroll: {
    flex: 1,
  },
  webScrollContent: {
    flexGrow: 1,
  },
  webPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
