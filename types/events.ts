import type { Ionicons } from '@expo/vector-icons';

// The interest taxonomy from the quiz (INTEREST_OPTIONS in data/preferences.ts), plus 'Other' for events that match none
export type EventCategory =
  | 'Music'
  | 'Food'
  | 'Outdoors'
  | 'Art'
  | 'Fitness'
  | 'Comedy'
  | 'Books'
  | 'Nightlife'
  | 'Yoga'
  | 'Photography'
  | 'Movies'
  | 'Dance'
  | 'Tech'
  | 'Theater'
  | 'Wellness'
  | 'Gaming'
  | 'Running'
  | 'Fashion'
  | 'Networking'
  | 'Finance'
  | 'Other';

export type EventTone = 'green' | 'pink' | 'blue' | 'yellow';

export type EventSource = 'luma' | 'ticketmaster' | 'eventbrite' | 'meetup' | 'seatgeek' | 'predicthq' | 'nycparks';

export type EventItem = {
  // `${source}-${source's own id}`
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  // ISO 8601, e.g. 2026-10-30T23:30:00.000Z. Shown in New York time.
  startAt: string;
  // Same format as startAt. Estimated (start + 2h) when the source has no end time.
  endAt: string;
  // 0 means free, null means the source didn't say
  price: number | null;
  tone: EventTone;
  icon: keyof typeof Ionicons.glyphMap;
  imageUrl: string | null;
  host: string;
  externalUrl: string;
  source: EventSource;
  // Distance from the user's location, set when the feed is ranked
  distanceMiles?: number;
};
