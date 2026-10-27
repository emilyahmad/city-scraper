import { Text, View } from 'react-native';

import { EventImage } from '@/components/EventImage';
import type { EventItem } from '@/types/events';

type EventCardProps = {
  event: EventItem;
};

const TIME_ZONE = 'America/New_York';

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE });
}

// e.g. "Fri, Oct 30 · 7:00 - 9:00 PM", or "11:30 PM - 1:30 AM" when the period changes
export function formatWhen(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const day = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TIME_ZONE,
  });
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  const samePeriod = startTime.slice(-2) === endTime.slice(-2);
  return `${day} · ${samePeriod ? startTime.slice(0, -3) : startTime} - ${endTime}`;
}

// null means the source didn't list a price
export const formatPrice = (price: number | null) => (price === null ? 'See tickets' : price === 0 ? 'Free' : `$${price}`);

// e.g. "Elsewhere · Brooklyn", skipping whichever part the source left blank
export const formatPlace = (event: EventItem) => [event.venue, event.neighborhood].filter(Boolean).join(' · ');

export function EventCard({ event }: EventCardProps) {
  return (
    <View className={`event-card event-card--${event.tone}`}>
      <View className="event-card__row">
        <View className="event-card__body">
          <Text className="event-card__date">{formatWhen(event.startAt, event.endAt)}</Text>
          <Text className="event-card__title" numberOfLines={2}>
            {event.title}
          </Text>
          <Text className="event-card__description" numberOfLines={2}>
            {event.description}
          </Text>
        </View>
        <View className="event-card__thumb">
          <EventImage event={event} iconSize={28} />
        </View>
      </View>
      <View className="event-card__footer">
        <Text className="event-card__venue" numberOfLines={1}>
          {formatPlace(event)}
        </Text>
        <Text className="event-card__price">{formatPrice(event.price)}</Text>
      </View>
    </View>
  );
}
