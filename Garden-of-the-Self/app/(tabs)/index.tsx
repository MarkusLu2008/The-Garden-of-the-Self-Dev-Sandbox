import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useJournalStyles, spacing } from '@/utils/styles';
import { Colors, Fonts } from '@/constants/theme';
import { getVirtueTotals } from '@/services/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from 'expo-router';

const STAGE_MS = 500;
const LINES = 10;
const WIDTH = 20;

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

function padStage(art: string): string {
  // Only strip leading/trailing newlines so we keep intentional spaces in the art
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

function useGrowthAnimation(stageCount: number) {
  const breathe = useSharedValue(1);
  const [stage, setStage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStage(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setStage((prev) => {
        const next = Math.min(prev + 1, stageCount - 1);
        if (next >= stageCount - 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return next;
      });
    }, STAGE_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stageCount]);

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

  return { stage, animatedStyle };
}

export default function GardenScreen() {
  const journalStyles = useJournalStyles();
  const colorScheme = useColorScheme();
  const textColor = Colors[colorScheme ?? 'light'].text;
  const [curiosityPoints, setCuriosityPoints] = useState<number | null>(null);

  const { stage, animatedStyle } = useGrowthAnimation(PINE_STAGES.length);
  const displayArt = padStage(PINE_STAGES[stage]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const totals = await getVirtueTotals();
          if (!cancelled) {
            const value = totals['Curiosity'] ?? 0;
            setCuriosityPoints(value);
          }
        } catch (e) {
          console.warn('Failed to load virtue totals', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <SafeAreaView style={journalStyles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Your Garden
        </ThemedText>

        {curiosityPoints !== null && (
          <ThemedText style={styles.curiosity}>
            Curiosity points: {curiosityPoints}
          </ThemedText>
        )}

        <Animated.View style={[styles.asciiWrapper, animatedStyle]}>
          <Text
            style={[styles.asciiArt, { color: textColor }]}
            selectable={false}
          >
            {displayArt}
          </Text>
        </Animated.View>

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
  title: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  curiosity: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  asciiWrapper: {
    marginVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
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
  },
});
