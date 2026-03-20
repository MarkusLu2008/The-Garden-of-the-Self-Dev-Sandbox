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
      'A virtue ethics based  app that helps you cultivate personal virtues through reflection, mindful writing and healthy habits in the form of daily quests.',
    highlightColor: 'tint',
  },
  {
    icon: 'book.fill',
    title: 'Journal with Virtues',
    description:
      'Tag entries with virtues like Courage, Kindness, and Wisdom. Each journal reflects the qualities you want to nurture. Your first journal entry each day is worth 5 points and can be tagged with up to 5 virtues.',
    highlightColor: 'secondary',
  },
  {
    icon: 'tree.fill',
    title: 'Grow Your Garden',
    description:
      'Watch virtues bloom as you nurture them through journaling and daily quests. Your garden is a living reflection of your inner growth.',
    highlightColor: 'success',
  },
  {
    icon: 'flag.checkered',
    title: 'Daily Quests',
    description:
      'Each day brings quests to inspire journaling and self-reflection. Complete them to tend your garden and grow your virtues. We belive that good habits build good people and good people live good lives.',
    highlightColor: 'accent',
  },
];
