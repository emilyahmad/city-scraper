import type { Coordinates } from '@/lib/cities';
import type { EventSource } from '@/types/events';

// What every source gets asked for
export type SourceQuery = Coordinates & {
  radiusMiles: number;
  interests: string[];
  from: Date;
  to: Date;
};

// An event as a source gives it to us, before it's categorized and turned into an EventItem
export type RawEvent = {
  source: EventSource;
  sourceId: string;
  title: string;
  description: string;
  // ISO 8601 (any offset)
  startAt: string;
  endAt: string | null;
  venue: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  price: number | null;
  url: string;
  host: string;
  // The source's own genre/category labels, used to pick our category
  sourceCategories: string[];
};

export type Scraper = (query: SourceQuery) => Promise<RawEvent[]>;
