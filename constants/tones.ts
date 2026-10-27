import type { EventItem, EventTone } from '@/types/events';

// Same colors as the .event-card--* classes in global.css, for places that can't use classes (map pins).
export const TONE_COLORS: Record<EventTone, string> = {
  green: '#a3b077',
  pink: '#f2bfdc',
  blue: '#c3cff0',
  yellow: '#f3de87',
};

// Cards cycle through these in order, so neighbouring cards never share a color.
export const TONE_SEQUENCE: EventTone[] = ['green', 'pink', 'yellow', 'blue'];

export const withToneSequence = (events: EventItem[]) =>
  events.map((event, index) => ({ ...event, tone: TONE_SEQUENCE[index % TONE_SEQUENCE.length] }));
