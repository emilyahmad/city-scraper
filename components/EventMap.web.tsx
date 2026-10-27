import { StyleSheet, Text, View } from 'react-native';

import type { EventItem } from '@/types/events';

type EventMapProps = {
  events: EventItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

// react-native-maps doesn't run on web, so show a placeholder instead.
export function EventMap({ events }: EventMapProps) {
  return (
    <View style={StyleSheet.absoluteFill} className="map-placeholder">
      <Text className="map-placeholder__text">Map is available on iOS and Android ({events.length} events)</Text>
    </View>
  );
}
