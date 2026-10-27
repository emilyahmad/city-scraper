import { CATEGORY_STYLES } from '@/constants/categories';
import { categorize } from '@/lib/categorize';
import type { RawEvent } from '@/lib/scrapers/types';
import type { EventItem } from '@/types/events';

// Used when a source doesn't say when an event ends
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

// Turns a source's event into the app's EventItem, or null if it can't be shown (no place on the map or no valid time)
export function normalize(raw: RawEvent): EventItem | null {
  const start = new Date(raw.startAt);
  if (Number.isNaN(start.getTime()) || raw.latitude === null || raw.longitude === null || !raw.title || !raw.url) return null;
  if (!Number.isFinite(raw.latitude) || !Number.isFinite(raw.longitude)) return null;

  const end = raw.endAt ? new Date(raw.endAt) : null;
  const validEnd = end && end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS);
  const category = categorize(raw.title, raw.description, raw.sourceCategories);

  return {
    id: `${raw.source}-${raw.sourceId}`,
    title: raw.title.trim(),
    description: raw.description,
    category,
    venue: raw.venue,
    neighborhood: raw.neighborhood,
    latitude: raw.latitude,
    longitude: raw.longitude,
    startAt: start.toISOString(),
    endAt: validEnd.toISOString(),
    price: raw.price,
    ...CATEGORY_STYLES[category],
    imageUrl: raw.imageUrl,
    host: raw.host,
    externalUrl: raw.url,
    source: raw.source,
  };
}
