import type { Ionicons } from '@expo/vector-icons';

export type EventCategory = 'Movies' | 'Film' | 'Theater' | 'Broadway' | 'Comedy' | 'Opera';

export type EventTone = 'green' | 'pink' | 'blue' | 'yellow';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  // ISO 8601 with the New York offset, e.g. 2026-10-30T19:30:00-04:00
  startAt: string;
  // 0 means free
  price: number;
  tone: EventTone;
  icon: keyof typeof Ionicons.glyphMap;
  imageUrl: string;
  host: string;
};
