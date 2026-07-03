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
import { getVirtueTotalsAndUnlocked, getAllVirtueProgress, type VirtueProgressRow } from '@/services/db';
import { useFocusEffect } from 'expo-router';
import virtues from '@/constants/virtues';
import { gameConfig } from '@/constants/gameConfig';
import { VIRTUE_TREE_IMAGES, treeScoreToStage } from '@/constants/virtueTreeImages';
import { getSeedShownThresholdFromUnlockedCount } from '@/utils/virtueGraph';
import { levelProgress, levelStageName } from '@/utils/questScoring';

const LINES = 10;
const WIDTH = 20;
const STAGE_THRESHOLD = gameConfig.trees.asciiStageThreshold;

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
  isUnlocked: boolean;
  curiosityEverCrossed5: boolean;
  textColor: string;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  virtueProgress: VirtueProgressRow | null;
};

function VirtueGardenPage({
  virtueName,
  score,
  isUnlocked,
  curiosityEverCrossed5,
  textColor,
  animatedStyle,
  virtueProgress,
}: VirtueGardenPageProps) {
  const treeImages = VIRTUE_TREE_IMAGES[virtueName];
  const hasTreeImages = treeImages != null && treeImages.length > 0;
  const isDeadTree =
    hasTreeImages &&
    isUnlocked &&
    score < gameConfig.unlocking.unlocksAfterTotalPoints &&
    (virtueName !== gameConfig.unlocking.decayGateVirtue || curiosityEverCrossed5);
  const lastLivingStage = Math.max(0, treeImages.length - 2);
  const treeStage = hasTreeImages
    ? isDeadTree
      ? treeImages.length - 1
      : Math.min(treeScoreToStage(score, treeImages.length), lastLivingStage)
    : 0;
  const pineStage = scoreToStage(score, PINE_STAGES.length);
  const displayArt = padStage(PINE_STAGES[pineStage]);

  const level = virtueProgress?.level ?? 1;
  const specPts = virtueProgress?.spec_points ?? 0;
  const progress = levelProgress(specPts);
  const stageName = levelStageName(level);
  const progressPercent = `${Math.round(progress * 100)}%` as const;

  return (
    <View style={styles.page}>
      <ThemedText type="subtitle" style={styles.virtueName}>
        {virtueName}
      </ThemedText>
      <ThemedText style={styles.scoreText}>
        {virtueName} points: {score}
      </ThemedText>
      <ThemedText style={styles.levelText}>
        Lv. {level} · {stageName}
      </ThemedText>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: progressPercent }]} />
      </View>
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

  const [virtueData, setVirtueData] = useState<{
    totals: Record<string, number>;
    unlockedAt: Record<string, string | null>;
    curiosityEverCrossed5: boolean;
  } | null>(null);
  const [virtueProgressMap, setVirtueProgressMap] = useState<Record<string, VirtueProgressRow>>({});
  const [pageIndex, setPageIndex] = useState(0);

  const breathingStyle = useBreathingAnimation();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [data, progress] = await Promise.all([
            getVirtueTotalsAndUnlocked(),
            getAllVirtueProgress(),
          ]);
          if (!cancelled) {
            setVirtueData(data);
            setVirtueProgressMap(progress);
          }
        } catch (e) {
          console.warn('Failed to load virtue totals and unlocked', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const totals = virtueData?.totals ?? {};
  const unlockedAt = virtueData?.unlockedAt ?? {};
  const curiosityEverCrossed5 = virtueData?.curiosityEverCrossed5 ?? false;
  const unlockedVirtueCount = virtues.reduce(
    (count, name) => count + (unlockedAt[name] != null ? 1 : 0),
    0
  );
  const seedShownThreshold = getSeedShownThresholdFromUnlockedCount(unlockedVirtueCount);
  const visibleVirtues =
    virtueData == null
      ? []
      : virtues
          .filter((name) => {
            if (unlockedAt[name] != null) return true;
            return (totals[name] ?? 0) >= seedShownThreshold;
          })
          .sort((a, b) => {
            const ta = unlockedAt[a];
            const tb = unlockedAt[b];
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return ta.localeCompare(tb);
          });

  useEffect(() => {
    setPageIndex((prev) => Math.min(prev, Math.max(0, visibleVirtues.length - 1)));
  }, [visibleVirtues.length]);

  const pageContent = (
    <>
      <ThemedText type="title" style={styles.title}>
        Your Garden
      </ThemedText>
      <ThemedText style={styles.pageIndicator}>
        {visibleVirtues.length > 0 ? `${pageIndex + 1} / ${visibleVirtues.length}` : ''}
      </ThemedText>
    </>
  );

  const emptyState = (
    <ThemedView style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Your Garden
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {virtueData == null
          ? 'Loading…'
          : 'No plants yet — complete quests or earn virtue points to grow your garden.'}
      </ThemedText>
    </ThemedView>
  );

  if (visibleVirtues.length === 0) {
    return (
      <SafeAreaView style={journalStyles.container} edges={['top']}>
        {emptyState}
      </SafeAreaView>
    );
  }

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
              setPageIndex(Math.min(index, visibleVirtues.length - 1));
            }}
            style={styles.webScroll}
            contentContainerStyle={styles.webScrollContent}
          >
            {visibleVirtues.map((virtueName) => (
              <View key={virtueName} style={[styles.webPage, { width: windowWidth }]}>
                <VirtueGardenPage
                  virtueName={virtueName}
                  score={totals[virtueName] ?? 0}
                  isUnlocked={unlockedAt[virtueName] != null}
                  curiosityEverCrossed5={curiosityEverCrossed5}
                  textColor={textColor}
                  animatedStyle={breathingStyle}
                  virtueProgress={virtueProgressMap[virtueName] ?? null}
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
        {visibleVirtues.map((virtueName) => (
          <View key={virtueName} style={styles.pagerPage}>
            <VirtueGardenPage
              virtueName={virtueName}
              score={totals[virtueName] ?? 0}
              isUnlocked={unlockedAt[virtueName] != null}
              curiosityEverCrossed5={curiosityEverCrossed5}
              textColor={textColor}
              animatedStyle={breathingStyle}
              virtueProgress={virtueProgressMap[virtueName] ?? null}
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  levelText: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: 160,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.25)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(122, 162, 247, 0.8)',
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
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
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
