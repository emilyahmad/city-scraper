import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import type { EventItem } from '@/types/events';

type EventCardProps = {
  event: EventItem;
};

const TIME_ZONE = 'America/New_York';

// e.g. "Fri, Oct 30 · 11:30 PM"
export function formatWhen(startAt: string) {
  const date = new Date(startAt);
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TIME_ZONE,
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
  return `${day} · ${time}`;
}

export function EventCard({ event }: EventCardProps) {
  const price = event.price === 0 ? 'Free' : `$${event.price}`;

  return (
    <View className={`event-card event-card--${event.tone}`}>
      <View className="event-card__row">
        <View className="event-card__body">
          <Text className="event-card__date">{formatWhen(event.startAt)}</Text>
          {/* The icon is nested in the text so it follows the last word, even when the title wraps. A non-breaking space keeps it from landing alone on a new line. */}
          <Text className="event-card__title" numberOfLines={2}>
            {event.title}
            {'\u00A0'}
            <Ionicons name={event.icon} size={18} color="#171717" />
          </Text>
          <Text className="event-card__description" numberOfLines={2}>
            {event.description}
          </Text>
        </View>
        <View className="event-card__thumb">
          <Image source={{ uri: event.imageUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        </View>
      </View>
      <View className="event-card__footer">
        <Text className="event-card__venue" numberOfLines={1}>
          {event.venue} · {event.neighborhood}
        </Text>
        <Text className="event-card__price">{price}</Text>
      </View>
    </View>
  );
}
