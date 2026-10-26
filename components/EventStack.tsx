import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { EventCard } from '@/components/EventCard';
import { SwipeableEventCard } from '@/components/SwipeableEventCard';
import { EVENTS } from '@/data/events';
import type { EventItem } from '@/types/events';

type EventStackProps = {
  events: EventItem[];
  onPin: (event: EventItem) => void;
  onArchive: (event: EventItem) => void;
  swipeProgress: SharedValue<number>;
  onPressTop?: (event: EventItem) => void;
};

const VISIBLE_CARDS = 3;
const MIN_TILT_DEG = 1;
const MAX_TILT_DEG = 3;

// Random-looking but stable tilt per event, so a card keeps its angle when it moves to the top.
// The magnitude is hashed from the id; the direction alternates with the event's position in the
// full list, so neighbouring cards always lean opposite ways.
function tiltFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  // Mix the bits so similar ids (e.g. "1", "2", "3") don't land on nearly the same angle
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  const magnitude = MIN_TILT_DEG + (((hash >>> 0) % 1000) / 1000) * (MAX_TILT_DEG - MIN_TILT_DEG);
  const index = EVENTS.findIndex((event) => event.id === id);
  return index % 2 === 0 ? magnitude : -magnitude;
}

export function EventStack({ events, onPin, onArchive, swipeProgress, onPressTop }: EventStackProps) {
  const visible = events.slice(0, VISIBLE_CARDS);

  return (
    <View className="event-stack">
      {/* Render back to front so the top card is drawn last. Cards behind sit exactly where the
          top card does, so the next card is already in place when the top one is swiped away. */}
      {visible
        .map((event, depth) => ({ event, depth }))
        .reverse()
        .map(({ event, depth }) => (
          <View
            key={event.id}
            className="event-stack__item"
            style={{ transform: [{ rotate: `${tiltFor(String(event.id))}deg` }] }}
          >
            {depth === 0 ? (
              <SwipeableEventCard
                event={event}
                onSwipeRight={() => onPin(event)}
                onSwipeLeft={() => onArchive(event)}
                onPress={() => onPressTop?.(event)}
                swipeProgress={swipeProgress}
              />
            ) : (
              <EventCard event={event} />
            )}
          </View>
        ))}
    </View>
  );
}
