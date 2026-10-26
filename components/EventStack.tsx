import { View } from 'react-native';

import { EventCard } from '@/components/EventCard';
import { SwipeableEventCard } from '@/components/SwipeableEventCard';
import type { EventItem } from '@/types/events';

type EventStackProps = {
  events: EventItem[];
  onPin: (event: EventItem) => void;
  onArchive: (event: EventItem) => void;
};

const VISIBLE_CARDS = 3;

// Cards behind the top one peek out above it, a little smaller and tilted.
function behindStyle(depth: number) {
  return {
    transform: [
      { translateY: -depth * 10 },
      { scale: 1 - depth * 0.05 },
      { rotate: `${depth % 2 === 0 ? 1.5 : -1.5}deg` },
    ],
  };
}

export function EventStack({ events, onPin, onArchive }: EventStackProps) {
  const visible = events.slice(0, VISIBLE_CARDS);

  return (
    <View className="event-stack">
      {/* Render back to front so the top card is drawn last */}
      {visible
        .map((event, depth) => ({ event, depth }))
        .reverse()
        .map(({ event, depth }) => (
          <View key={event.id} className="event-stack__item" style={depth === 0 ? undefined : behindStyle(depth)}>
            {depth === 0 ? (
              <SwipeableEventCard
                event={event}
                onSwipeRight={() => onPin(event)}
                onSwipeLeft={() => onArchive(event)}
              />
            ) : (
              <EventCard event={event} />
            )}
          </View>
        ))}
    </View>
  );
}
