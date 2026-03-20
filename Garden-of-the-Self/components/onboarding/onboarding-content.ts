import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type OnboardingPageData = {
  icon: IconSymbolName;
  title: string;
  description: string;
  highlightColor: 'tint' | 'success' | 'secondary' | 'accent';
};

export const onboardingPages: OnboardingPageData[] = [
  {
    icon: 'leaf.fill',
    title: 'Welcome to\nGarden of the Self',
    description:
      'A journaling app that helps you cultivate personal virtues through reflection and mindful writing.',
    highlightColor: 'tint',
  },
  {
    icon: 'book.fill',
    title: 'Journal with Virtues',
    description:
      'Tag entries with virtues like Courage, Kindness, and Wisdom. Each journal reflects the qualities you want to nurture.',
    highlightColor: 'secondary',
  },
  {
    icon: 'tree.fill',
    title: 'Grow Your Garden',
    description:
      'Watch virtues bloom as you nurture them through journaling. Your garden is a living reflection of your inner growth.',
    highlightColor: 'success',
  },
  {
    icon: 'flag.checkered',
    title: 'Daily Quests',
    description:
      'Each day brings quests to inspire journaling and self-reflection. Complete them to tend your garden and grow your virtues.',
    highlightColor: 'accent',
  },
];
