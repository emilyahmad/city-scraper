import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { TONE_COLORS } from '@/constants/tones';
import type { EventItem } from '@/types/events';

type EventMapProps = {
  events: EventItem[];
  activeId?: string;
  // Bump to re-center on the active event after the user has panned away
  recenterKey?: number;
  // false once the user drags or zooms away from the active event, true when the map returns to it
  onCenteredChange?: (centered: boolean) => void;
};

const NYC_REGION = {
  latitude: 40.7413,
  longitude: -73.9906,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

// Center a bit south of the pin so it sits above the card stack.
const CENTER_LAT_OFFSET = 0.006;

export function EventMap({ events, activeId, recenterKey = 0, onCenteredChange }: EventMapProps) {
  const mapRef = useRef<MapView>(null);
  const active = events.find((event) => event.id === activeId);

  useEffect(() => {
    if (!active) return;
    onCenteredChange?.(true);
    mapRef.current?.animateToRegion(
      {
        latitude: active.latitude - CENTER_LAT_OFFSET,
        longitude: active.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      500,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, recenterKey]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={NYC_REGION}
      onPanDrag={() => onCenteredChange?.(false)}
      onRegionChangeComplete={(_region, details) => {
        if (details?.isGesture) onCenteredChange?.(false);
      }}
      userInterfaceStyle="dark"
      showsPointsOfInterests={false}>
      {events.map((event) => {
        const isActive = event.id === activeId;
        return (
          <Marker
            key={`${event.id}-${isActive}`}
            coordinate={{ latitude: event.latitude, longitude: event.longitude }}
            zIndex={isActive ? 1 : 0}>
            <View
              className={isActive ? 'event-pin event-pin--active' : 'event-pin'}
              style={{ backgroundColor: TONE_COLORS[event.tone] }}>
              <Ionicons name={event.icon} size={isActive ? 20 : 16} color="#171717" />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
