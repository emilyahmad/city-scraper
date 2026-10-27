import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { TONE_COLORS } from '@/constants/tones';
import type { EventItem } from '@/types/events';

type EventMapProps = {
  events: EventItem[];
  activeId?: string;
  // Bump to re-center on the active event after the user has panned away
  recenterKey?: number;
  // false once the user drags or zooms away from the active event, true when the map returns to it
  onCenteredChange?: (centered: boolean) => void;
  // Called with the event id when a pin other than the active one is tapped
  onSelect?: (id: string) => void;
  // Called on any tap or drag on the map
  onInteract?: () => void;
};

const NYC_REGION = {
  latitude: 40.7413,
  longitude: -73.9906,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

const FOCUS_DELTA = 0.03;
// Center a bit south of the pin so it sits above the card stack. A fraction of the visible
// span, so the pin lands in the same spot on screen at any zoom.
const CENTER_LAT_OFFSET_RATIO = 0.2;
// Each pin is a native view, so a big feed only draws the pins in (or just around) the visible
// region, best-ranked first, up to a cap. The active pin is always drawn.
const MAX_PINS = 150;
const REGION_PADDING_RATIO = 0.5;
// Custom marker views are snapshotted; keep tracking just long enough for the icon font to draw
const PIN_SNAPSHOT_MS = 500;

function isInRegion(event: EventItem, region: Region) {
  const latPad = region.latitudeDelta * (0.5 + REGION_PADDING_RATIO);
  const lngPad = region.longitudeDelta * (0.5 + REGION_PADDING_RATIO);
  return Math.abs(event.latitude - region.latitude) <= latPad && Math.abs(event.longitude - region.longitude) <= lngPad;
}

type EventPinProps = {
  event: EventItem;
  isActive: boolean;
  onPress: (event: EventItem, isActive: boolean) => void;
};

// Memoized so a swipe only re-renders the pins whose active state changed, not the whole map
const EventPin = memo(function EventPin({ event, isActive, onPress }: EventPinProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), PIN_SNAPSHOT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      zIndex={isActive ? 1 : 0}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress(event, isActive)}>
      <View
        className={isActive ? 'event-pin event-pin--active' : 'event-pin'}
        style={{ backgroundColor: TONE_COLORS[event.tone] }}>
        <Ionicons name={event.icon} size={isActive ? 20 : 16} color="#ffffff" />
      </View>
    </Marker>
  );
});

export function EventMap({ events, activeId, recenterKey = 0, onCenteredChange, onSelect, onInteract }:EventMapProps) {
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(NYC_REGION);
  // Set when a pin is tapped, so centering on it keeps the user's current zoom
  const keepZoomRef = useRef(false);
  const [visibleRegion, setVisibleRegion] = useState<Region>(NYC_REGION);
  const active = events.find((event) => event.id === activeId);

  const focus = useCallback(
    (event: EventItem, keepZoom: boolean) => {
      onCenteredChange?.(true);
      const latitudeDelta = keepZoom ? regionRef.current.latitudeDelta : FOCUS_DELTA;
      const longitudeDelta = keepZoom ? regionRef.current.longitudeDelta : FOCUS_DELTA;
      mapRef.current?.animateToRegion(
        {
          latitude: event.latitude - latitudeDelta * CENTER_LAT_OFFSET_RATIO,
          longitude: event.longitude,
          latitudeDelta,
          longitudeDelta,
        },
        500,
      );
    },
    [onCenteredChange],
  );

  useEffect(() => {
    if (!active) return;
    const keepZoom = keepZoomRef.current;
    keepZoomRef.current = false;
    focus(active, keepZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, recenterKey]);

  const handlePinPress = useCallback(
    (event: EventItem, isActive: boolean) => {
      onInteract?.();
      // The active pin is already on top, so just bring the map back to it
      if (isActive) {
        focus(event, false);
        return;
      }
      keepZoomRef.current = true;
      onSelect?.(event.id);
    },
    [focus, onInteract, onSelect],
  );

  const pins = useMemo(() => {
    const nearby = events.filter((event) => event.id !== activeId && isInRegion(event, visibleRegion)).slice(0, MAX_PINS);
    return active ? [...nearby, active] : nearby;
  }, [events, active, activeId, visibleRegion]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={NYC_REGION}
      onPress={onInteract}
      onPanDrag={() => {
        onInteract?.();
        onCenteredChange?.(false);
      }}
      onRegionChangeComplete={(region, details) => {
        regionRef.current = region;
        setVisibleRegion(region);
        if (details?.isGesture) onCenteredChange?.(false);
      }}
      userInterfaceStyle="dark"
      showsPointsOfInterests={false}>
      {pins.map((event) => {
        const isActive = event.id === activeId;
        // Remount when the active state changes, so the snapshot picks up the new size
        return <EventPin key={`${event.id}-${isActive}`} event={event} isActive={isActive} onPress={handlePinPress} />;
      })}
    </MapView>
  );
}
