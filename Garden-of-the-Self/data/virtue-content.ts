import type { VirtueName } from '@/constants/gameConfig';

/**
 * Authored content for each virtue: why it matters, the plant that represents
 * it in the garden (with the symbolism rationale), and an Aristotle quote.
 *
 * Attribution caution (per spec): only quotes with a real source are marked
 * as genuine translations; everything else is explicitly a paraphrase
 * "inspired by" Aristotle, never presented as his literal words. The
 * translations cited (W.D. Ross, Benjamin Jowett, W. Rhys Roberts) are
 * public domain.
 *
 * Note: the spec says "twelve virtues" but the app has always shipped 13
 * (see constants/gameConfig.ts VIRTUE_LIST). Decision: keep all 13 — the
 * spec count is treated as stale. This module is the source of truth that
 * every virtue has content.
 */

export type VirtueQuote = {
  text: string;
  /** e.g. "Aristotle, Nicomachean Ethics II.1 (trans. W.D. Ross)" or "Inspired by Aristotle". */
  attribution: string;
  /** True when the text is a modern paraphrase, not a translation of Aristotle. */
  isParaphrase: boolean;
};

export type VirtueContent = {
  virtue: VirtueName;
  /** 2–3 sentence explainer shown as "Why this virtue matters". */
  whyItMatters: string;
  /** Display name of the plant representing this virtue in the garden. */
  plant: string;
  /** Why this plant symbolizes this virtue. */
  plantSymbolism: string;
  quote: VirtueQuote;
};

export const virtueContent: Record<VirtueName, VirtueContent> = {
  Courage: {
    virtue: 'Courage',
    whyItMatters:
      'Courage is not the absence of fear but the willingness to act well despite it. Every honest conversation, new attempt, and defended principle passes through it first — which is why so many other virtues depend on courage to show up at all.',
    plant: 'Protea',
    plantSymbolism:
      'The protea evolved to bloom after wildfire: heat cracks its seed pods open. It flowers precisely because it faced the flames — the way courage grows through the situations we fear.',
    quote: {
      text: 'The brave man endures and fears the right things, for the right motive, in the right way and at the right time.',
      attribution: 'Aristotle, Nicomachean Ethics III.7 (trans. W.D. Ross, adapted)',
      isParaphrase: false,
    },
  },
  Temperance: {
    virtue: 'Temperance',
    whyItMatters:
      'Temperance is choosing your pleasures rather than being chosen by them. It protects your energy, attention, and health from a thousand small overindulgences, leaving room for the things you actually value.',
    plant: 'Bonsai',
    plantSymbolism:
      'A bonsai is shaped by deliberate, gentle restraint: what is pruned matters as much as what is kept. Its beauty comes from measured growth, not unchecked sprawl.',
    quote: {
      text: 'The temperate man craves for the things he ought, as he ought, and when he ought.',
      attribution: 'Aristotle, Nicomachean Ethics III.12 (trans. W.D. Ross, adapted)',
      isParaphrase: false,
    },
  },
  Patience: {
    virtue: 'Patience',
    whyItMatters:
      'Patience is strength held in reserve — staying calm when things are slow, people are difficult, or results refuse to arrive on schedule. It turns frustration into steadiness and keeps small irritations from becoming big regrets.',
    plant: 'Bamboo',
    plantSymbolism:
      'Bamboo spends years building roots underground before it visibly shoots up. The quiet seasons were never wasted time — they were the growth you could not see yet.',
    quote: {
      text: 'The man who is angry at the right things and with the right people, and further, as he ought, when he ought, and as long as he ought, is praised.',
      attribution: 'Aristotle, Nicomachean Ethics IV.5 (trans. W.D. Ross)',
      isParaphrase: false,
    },
  },
  Kindness: {
    virtue: 'Kindness',
    whyItMatters:
      'Kindness is helpfulness with no invoice attached. It compounds quietly: small generous acts change how people treat each other around you, and being useful to others is one of the most reliable sources of meaning we know.',
    plant: 'Sunflower',
    plantSymbolism:
      'A sunflower feeds everyone around it — bees in summer, birds in autumn — while asking nothing back. It gives away its seeds, and that is exactly how more sunflowers happen.',
    quote: {
      text: 'Kindness is helpfulness towards someone in need, not in return for anything, nor for the advantage of the helper himself, but for that of the person helped.',
      attribution: 'Aristotle, Rhetoric II.7 (trans. W. Rhys Roberts)',
      isParaphrase: false,
    },
  },
  'Proper Ambition': {
    virtue: 'Proper Ambition',
    whyItMatters:
      'Proper ambition is wanting the right things, the right amount — aiming high without being consumed, and without shrinking from goals you deserve to pursue. It is the difference between being driven and being devoured.',
    plant: 'Sequoia',
    plantSymbolism:
      'A sequoia aims at the sky for centuries, but only because its base is wide and its growth is steady. Great height built on a strong foundation — ambition in its proper form.',
    quote: {
      text: 'There is a right degree of ambition: honor may be desired more than is right, or less, or from the right sources and in the right way.',
      attribution: 'Inspired by Aristotle, Nicomachean Ethics IV.4 (paraphrase)',
      isParaphrase: true,
    },
  },
  Modesty: {
    virtue: 'Modesty',
    whyItMatters:
      'Modesty is an honest size estimate of yourself — neither inflated nor falsely small. It keeps you teachable, makes your confidence trustworthy, and lets your work speak at its true volume.',
    plant: 'Violet',
    plantSymbolism:
      'The violet is the classic emblem of modesty: it grows low, half-hidden under its own leaves, yet its color and scent are unmistakable. Quiet presentation, real substance.',
    quote: {
      text: 'The modest man neither overstates what is his, nor claims what is not — he stands at his true height.',
      attribution: 'Inspired by Aristotle, Nicomachean Ethics IV.7 (paraphrase)',
      isParaphrase: true,
    },
  },
  Empathy: {
    virtue: 'Empathy',
    whyItMatters:
      'Empathy is the skill of actually feeling your way into another perspective before judging it. It is what turns coexistence into friendship, disagreement into understanding, and it is learned only by practicing it on real people.',
    plant: 'Mimosa',
    plantSymbolism:
      "The mimosa folds its leaves at the lightest touch — a plant visibly moved by what it meets. Empathy is that same responsiveness: letting another's experience actually register.",
    quote: {
      text: 'A friend is another self: to understand him, look at him as you would look at yourself.',
      attribution: 'Inspired by Aristotle, Nicomachean Ethics IX.4 (paraphrase)',
      isParaphrase: true,
    },
  },
  Resilience: {
    virtue: 'Resilience',
    whyItMatters:
      'Resilience is how you metabolize setbacks — the capacity to absorb a hit, recover shape, and keep going without pretending it did not hurt. Every long-term goal you care about will, at some point, depend on it.',
    plant: 'Cactus',
    plantSymbolism:
      'A cactus stores up reserves in good times and endures long droughts on them, blooming when conditions least suggest it should. Hard seasons are part of its design, not an exception to it.',
    quote: {
      text: 'The truly good and wise man bears all the chances of life becomingly, and always makes the best of circumstances.',
      attribution: 'Aristotle, Nicomachean Ethics I.10 (trans. W.D. Ross, adapted)',
      isParaphrase: false,
    },
  },
  Curiosity: {
    virtue: 'Curiosity',
    whyItMatters:
      'Curiosity is the engine of every other kind of growth: it turns strangers into teachers, problems into puzzles, and boredom into exploration. A day with one genuine question in it is rarely a wasted day.',
    plant: 'Fern',
    plantSymbolism:
      'A fern frond starts as a tight spiral and unfurls outward toward whatever light it finds. Curiosity has the same shape: something coiled in you opening toward the unknown.',
    quote: {
      text: 'All men by nature desire to know.',
      attribution: 'Aristotle, Metaphysics I.1 (trans. W.D. Ross)',
      isParaphrase: false,
    },
  },
  Respectfulness: {
    virtue: 'Respectfulness',
    whyItMatters:
      'Respectfulness is treating people as ends, not obstacles — in speech, in attention, in small courtesies. It costs almost nothing per act, yet it is the foundation every good relationship and community is built on.',
    plant: 'Willow',
    plantSymbolism:
      'The willow is strong enough to hold a riverbank together, yet it bows with every wind that passes. Strength and deference in the same tree — that is respect.',
    quote: {
      text: 'What we owe to others, we owe first in how we speak to them and of them.',
      attribution: 'Inspired by Aristotle (paraphrase)',
      isParaphrase: true,
    },
  },
  Tolerance: {
    virtue: 'Tolerance',
    whyItMatters:
      'Tolerance is making room for people, habits, and opinions that grate against your own without needing to erase them. It is not agreement — it is the discipline of sharing a world with genuine difference.',
    plant: 'Olive',
    plantSymbolism:
      'The olive tree — the ancient emblem of peace — thrives in rocky, dry, difficult soil and lives for centuries. It makes a lasting peace with conditions it cannot change.',
    quote: {
      text: 'It is the mark of a trained mind to look for precision only as far as each subject allows — and to let others differ where difference is the nature of the thing.',
      attribution: 'Inspired by Aristotle, Nicomachean Ethics I.3 (paraphrase)',
      isParaphrase: true,
    },
  },
  Collaboration: {
    virtue: 'Collaboration',
    whyItMatters:
      'Almost nothing that matters is built alone. Collaboration is the craft of combining strengths — communicating, dividing work, giving credit — so a group can reach what no member could touch individually.',
    plant: 'Aspen',
    plantSymbolism:
      'An aspen grove looks like many trees but is often one living organism sharing a single root system. Each trunk stands on the strength of all the others.',
    quote: {
      text: 'Man is by nature a social animal; society is something that precedes the individual.',
      attribution: 'Aristotle, Politics I.2 (trans. Benjamin Jowett, adapted)',
      isParaphrase: false,
    },
  },
  Discipline: {
    virtue: 'Discipline',
    whyItMatters:
      'Discipline is keeping promises to yourself when motivation has gone home for the day. It converts intentions into identity: what you do repeatedly, on ordinary days, is what you actually become.',
    plant: 'Boxwood',
    plantSymbolism:
      'A boxwood hedge holds its clean shape only through steady, regular tending — skip a season and the form blurs. Its elegance is nothing but consistency made visible.',
    quote: {
      text: 'We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.',
      attribution: 'Aristotle, Nicomachean Ethics II.1 (trans. W.D. Ross)',
      isParaphrase: false,
    },
  },
};

/** Look up content by virtue display name; null for unknown names. */
export function getVirtueContent(name: string): VirtueContent | null {
  return (virtueContent as Record<string, VirtueContent>)[name] ?? null;
}

/** Formatted quote line with explicit paraphrase marking. */
export function formatVirtueQuote(quote: VirtueQuote): string {
  return `“${quote.text}”\n— ${quote.attribution}`;
}
