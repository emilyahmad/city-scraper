import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { TONE_COLORS } from '@/constants/tones';
import type { EventItem } from '@/types/events';

type EventImageProps = {
  event: EventItem;
  // Size of the category icon shown when the event has no image
  iconSize: number;
};

// Fills its parent with the event's image, or the category icon when the source had no image
export function EventImage({ event, iconSize }: EventImageProps) {
  if (!event.imageUrl) {
    return (
      <View className="event-image__fallback" style={{ backgroundColor: TONE_COLORS[event.tone] }}>
        <Ionicons name={event.icon} size={iconSize} color="#ffffff" />
      </View>
    );
  }
  return <Image source={{ uri: event.imageUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />;
}
