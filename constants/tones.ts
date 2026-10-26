import type { EventTone } from '@/types/events';

// Same colors as the .event-card--* classes in global.css, for places that can't use classes (map pins).
export const TONE_COLORS: Record<EventTone, string> = {
  green: '#a3b077',
  pink: '#f2bfdc',
  blue: '#c3cff0',
  yellow: '#f3de87',
};
