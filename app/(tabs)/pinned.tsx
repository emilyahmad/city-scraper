import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeableEventCard } from '@/components/SwipeableEventCard';
import { images } from '@/constants/images';
import { withToneSequence } from '@/constants/tones';
import { useEventsStore } from '@/store/events';
import type { EventItem } from '@/types/events';

// Cards below an archived one glide up into the gap instead of jumping
const SHIFT_UP = LinearTransition.duration(140).easing(Easing.out(Easing.cubic));

export default function PinnedScreen() {
  const pinnedEvents = useEventsStore((state) => state.pinnedEvents);
  const unpin = useEventsStore((state) => state.unpin);
  const clearNewPin = useEventsStore((state) => state.clearNewPin);
  // Kept after closing so the modal still has the event while it slides away
  const [detailEvent, setDetailEvent] = useState<EventItem>();
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (event: EventItem) => {
    setDetailEvent(event);
    setDetailOpen(true);
  };

  // Opening the tab counts as seeing the new pin
  useFocusEffect(
    useCallback(() => {
      clearNewPin();
    }, [clearNewPin]),
  );

  const pinned = withToneSequence([...pinnedEvents].sort((a, b) => a.startAt.localeCompare(b.startAt)));

  return (
    <SafeAreaView edges={['top']} className="tab-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="tab-screen__content">
        <ScreenHeader title="Pinned" subtitle="Your saved events" />
        {pinned.length === 0 ? (
          <EmptyState
            icon={{ image: images.pinnedIcons }}
            title="Nothing pinned yet"
            message="Swipe right on an event to pin it and it will show up here."
          />
        ) : (
          pinned.map((event) => (
            <Animated.View key={event.id} layout={SHIFT_UP} className="pinned-item">
              {/* Swiping left unpins and archives, so the event doesn't return to the feed */}
              <SwipeableEventCard event={event} onSwipeLeft={() => unpin(event.id)} onPress={() => openDetail(event)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
      {/* Already pinned, so the modal only offers swipe left (unpin and archive) */}
      <EventDetailModal
        event={detailEvent}
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onArchive={(event) => unpin(event.id)}
      />
    </SafeAreaView>
  );
}
