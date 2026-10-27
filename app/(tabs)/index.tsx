import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventDetailModal } from '@/components/EventDetailModal';
import { EventMap } from '@/components/EventMap';
import { EventStack } from '@/components/EventStack';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeBackdrop } from '@/components/SwipeBackdrop';
import { GAP_ABOVE_TAB_BAR, TAB_BAR_HEIGHT } from '@/constants/layout';
import { withToneSequence } from '@/constants/tones';
import { useEvents } from '@/hooks/useEvents';
import { useEventsStore } from '@/store/events';
import type { EventItem } from '@/types/events';

const HEADER_HIDE_DELAY_MS = 3000;
const HEADER_SLIDE_DISTANCE = 24;

// Keeps events that are neither pinned nor archived
const unseenFilter = (pinned: EventItem[], archived: string[]) => {
  const seen = new Set([...pinned.map((event) => event.id), ...archived]);
  return (event: EventItem) => !seen.has(event.id);
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const swipeProgress = useSharedValue(0);
  const [recenterKey, setRecenterKey] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const headerProgress = useSharedValue(1);
  const centeredRef = useRef(true);
  const stackBottom = Math.max(insets.bottom - 6, 6) + TAB_BAR_HEIGHT + GAP_ABOVE_TAB_BAR;
  const { events, loading, error, refresh } = useEvents();
  const pinnedEvents = useEventsStore((state) => state.pinnedEvents);
  const archivedIds = useEventsStore((state) => state.archivedIds);
  const pin = useEventsStore((state) => state.pin);
  const archive = useEventsStore((state) => state.archive);

  // Colors follow the feed order when it loads, then stay with each card so it keeps its color as it moves up the stack.
  const tonedEvents = useMemo(() => {
    const { pinnedEvents: pinnedNow, archivedIds: archivedNow } = useEventsStore.getState();
    return withToneSequence(events.filter(unseenFilter(pinnedNow, archivedNow)));
  }, [events]);
  // Memoized with Set lookups so a big feed doesn't get rescanned on every render (e.g. each header show/hide)
  const feed = useMemo(() => {
    const baseFeed = tonedEvents.filter(unseenFilter(pinnedEvents, archivedIds));
    // Events picked from the map go first (latest on top), so the previous top card stays right underneath.
    const byId = new Map(baseFeed.map((event) => [event.id, event]));
    const promoted = promotedIds.flatMap((id) => byId.get(id) ?? []);
    const promotedSet = new Set(promotedIds);
    return [...promoted, ...baseFeed.filter((event) => !promotedSet.has(event.id))];
  }, [tonedEvents, pinnedEvents, archivedIds, promotedIds]);

  const topId = feed[0]?.id;

  // Bump on every visit to this tab so the header re-appears.
  useFocusEffect(useCallback(() => { setFocusCount((count) => count + 1); }, []));

  // Show the header, then hide it after a while. Each call restarts the countdown.
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showHeader = useCallback(() => {
    headerProgress.set(withTiming(1, { duration: 200 }));
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => headerProgress.set(withTiming(0, { duration: 400 })), HEADER_HIDE_DELAY_MS);
  }, [headerProgress]);

  // Re-shows on tab focus, modal close and swipes.
  useEffect(() => {
    if (detailOpen) return;
    showHeader();
    return () => clearTimeout(hideTimer.current);
  }, [focusCount, detailOpen, topId, showHeader]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: (1 - headerProgress.value) * -HEADER_SLIDE_DISTANCE }],
  }));

  // First tap brings the map back to the event; once it's centered, tapping again opens the details.
  const handleCardPress = () => {
    if (centeredRef.current) setDetailOpen(true);
    else setRecenterKey((key) => key + 1);
  };

  // Stable so the map's memoized pins don't re-render with every screen render.
  // Tapping the active pin is handled inside the map, so this only promotes other events.
  const handleSelectEvent = useCallback((id: string) => {
    setPromotedIds((ids) => [id, ...ids.filter((existing) => existing !== id)]);
  }, []);
  const handleCenteredChange = useCallback((centered: boolean) => {
    centeredRef.current = centered;
  }, []);
  const handleMapInteract = useCallback(() => {
    if (!detailOpen) showHeader();
  }, [detailOpen, showHeader]);

  const renderBody = () => {
    if (feed.length > 0) {
      return (
        <EventStack events={feed} swipeProgress={swipeProgress} onPressTop={handleCardPress} onPin={pin} onArchive={archive} />
      );
    }
    if (loading) {
      return <EmptyState title="Finding events near you" message="Checking Luma, Meetup, Eventbrite, NYC Parks and more for events that fit your preferences." loading />;
    }
    if (error) {
      return <EmptyState icon="cloud-offline-outline" title="Couldn't load events" message={error} action={{ label: 'Try again', onPress: refresh }} />;
    }
    if (events.length === 0) {
      return (
        <EmptyState
          icon="calendar-clear-outline"
          title="No events match yet"
          message="Nothing fits your availability and distance right now. Try widening them in Settings."
          action={{ label: 'Refresh', onPress: refresh }}
        />
      );
    }
    return (
      <EmptyState
        icon="checkmark-circle-outline"
        title="You're all caught up"
        message="You've gone through every event for now. Check back soon for more."
      />
    );
  };

  return (
    <View className="discover-screen">
      <EventMap events={feed} activeId={feed[0]?.id} recenterKey={recenterKey} onSelect={handleSelectEvent} onCenteredChange={handleCenteredChange} onInteract={handleMapInteract} />
      <SwipeBackdrop progress={swipeProgress} />
      <View className="discover-screen__overlay"
        style={{ paddingTop: insets.top, paddingBottom: stackBottom }}
        pointerEvents="box-none">
        <View className="discover-screen__header">
          <Animated.View style={headerStyle} pointerEvents="none">
            <ScreenHeader title="Explore" subtitle={`${feed.length.toLocaleString('en-US')} ${feed.length === 1 ? 'new event' : 'new events'} discovered matching your interests, availability, location, and commutable distance`} lightSubtitle />
          </Animated.View>
        </View>
        <View className="discover-screen__body">{renderBody()}</View>
      </View>
      <EventDetailModal event={feed[0]} visible={detailOpen} onClose={() => setDetailOpen(false)} onPin={pin} onArchive={archive} />
    </View>
  );
}
