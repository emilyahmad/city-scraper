import { CATEGORY_STYLES } from '@/constants/categories';
import { RELATED_INTERESTS } from '@/data/preferences';
import type { EventCategory } from '@/types/events';

type Category = Exclude<EventCategory, 'Other'>;

const CATEGORIES = Object.keys(CATEGORY_STYLES).filter((category) => category !== 'Other') as Category[];

// Words that point to each category, on top of the category name and its related interests from the quiz.
// Source labels are included too (e.g. Eventbrite's "Food & Drink", Ticketmaster's "Arts & Theatre").
const EXTRA_KEYWORDS: Record<Category, string[]> = {
  Music: ['concert', 'live music', 'dj', 'band', 'jazz', 'hip hop', 'rock', 'orchestra', 'symphony', 'choir', 'singer', 'album'],
  Food: ['dinner', 'brunch', 'tasting', 'chef', 'cooking', 'restaurant', 'wine', 'beer', 'coffee', 'bakery', 'baking', 'cake', 'supper club', 'food & drink'],
  Outdoors: ['park', 'hike', 'garden', 'gardening', 'kayak', 'outdoor', 'nature', 'birding', 'wildlife', 'waterfront', 'beach', 'picnic'],
  Art: ['gallery', 'exhibition', 'museum', 'painting', 'drawing', 'sculpture', 'ceramics', 'craft', 'visual arts', 'fine art'],
  Fitness: ['workout', 'bootcamp', 'cycling', 'spin', 'pickleball', 'tennis', 'basketball', 'soccer', 'sports', 'hiit', 'strength'],
  Comedy: ['comedian', 'standup', 'stand up', 'sketch'],
  Books: ['book', 'author', 'reading', 'literary', 'writers', 'library'],
  Nightlife: ['party', 'club night', 'rave', 'bar crawl', 'happy hour', 'drinks', 'cocktail', 'cocktails', 'rooftop'],
  Yoga: ['vinyasa'],
  Photography: ['photo', 'photographer', 'camera'],
  Movies: ['film', 'movie', 'cinema', 'screening', 'premiere', 'documentary'],
  Dance: ['dancing', 'bachata', 'tango', 'ballroom'],
  Tech: ['technology', 'developer', 'engineering', 'software', 'coding', 'machine learning', 'agents', 'robotics', 'builders', 'product'],
  Theater: ['theatre', 'play', 'opera', 'cabaret', 'arts & theatre'],
  Wellness: ['mindfulness', 'healing', 'mental health', 'self-care', 'health & wellness'],
  Gaming: ['game', 'games', 'chess', 'mahjong', 'video game', 'd&d'],
  Running: ['run', 'runners', 'run club', '5k', '10k', 'marathon', 'jog'],
  Fashion: ['style', 'designer', 'sample sale'],
  Networking: ['mixer', 'founders', 'professionals', 'career', 'business', 'panel', 'community'],
  Finance: ['investing', 'investor', 'vc', 'venture capital', 'fintech', 'wealth', 'money'],
};

// Every related interest under a category, following chains like Fitness → Climbing → Bouldering
function relatedTo(interest: string, seen = new Set<string>()): string[] {
  if (seen.has(interest)) return [];
  seen.add(interest);
  return (RELATED_INTERESTS[interest] ?? []).flatMap((related) => [related, ...relatedTo(related, seen)]);
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whole-word match, so "run" doesn't match "brunch"
const toPattern = (keywords: string[]) => new RegExp(`(^|[^a-z0-9])(${keywords.map(escape).join('|')})s?(?=$|[^a-z0-9])`, 'gi');

const CATEGORY_PATTERNS = CATEGORIES.map((category) => ({
  category,
  pattern: toPattern([category, ...relatedTo(category), ...EXTRA_KEYWORDS[category]].map((word) => word.toLowerCase())),
}));

const countMatches = (pattern: RegExp, text: string) => text.match(pattern)?.length ?? 0;

// Picks the category with the most keyword hits. The title and the source's own labels count more than the description.
export function categorize(title: string, description: string, sourceCategories: string[]): EventCategory {
  let best: EventCategory = 'Other';
  let bestScore = 0;
  for (const { category, pattern } of CATEGORY_PATTERNS) {
    const score =
      countMatches(pattern, title) * 3 + countMatches(pattern, sourceCategories.join(' | ')) * 2 + countMatches(pattern, description);
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

// The top-level category a quiz interest belongs to, e.g. "Bouldering" → Fitness
export function categoryForInterest(interest: string): EventCategory | null {
  if ((CATEGORIES as string[]).includes(interest)) return interest as Category;
  return CATEGORIES.find((category) => relatedTo(category).includes(interest)) ?? null;
}

// Matches an interest's own name (and its related interests) as whole words in some text
export const interestPattern = (interest: string) => toPattern([interest, ...relatedTo(interest)].map((word) => word.toLowerCase()));
