import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventDetailModal } from '@/components/EventDetailModal';
import { EventMap } from '@/components/EventMap';
import { EventStack } from '@/components/EventStack';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeBackdrop } from '@/components/SwipeBackdrop';
import { EVENTS } from '@/data/events';
import { useEventsStore } from '@/store/events';

// Floating tab bar: ~62px tall, sitting `max(bottom inset - 6, 6)` above the screen edge
const TAB_BAR_HEIGHT = 62;
const GAP_ABOVE_TAB_BAR = 28;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const swipeProgress = useSharedValue(0);
  const [recenterKey, setRecenterKey] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const centeredRef = useRef(true);
  const stackBottom = Math.max(insets.bottom - 6, 6) + TAB_BAR_HEIGHT + GAP_ABOVE_TAB_BAR;
  const pinnedIds = useEventsStore((state) => state.pinnedIds);
  const archivedIds = useEventsStore((state) => state.archivedIds);
  const pin = useEventsStore((state) => state.pin);
  const archive = useEventsStore((state) => state.archive);
  const reset = useEventsStore((state) => state.reset);

  const feed = EVENTS.filter((event) => !pinnedIds.includes(event.id) && !archivedIds.includes(event.id));

  // First tap brings the map back to the event; once it's centered, tapping again opens the details.
  const handleCardPress = () => {
    if (centeredRef.current) setDetailOpen(true);
    else setRecenterKey((key) => key + 1);
  };

  return (
    <View className="discover-screen">
      <EventMap events={feed} activeId={feed[0]?.id} recenterKey={recenterKey} onCenteredChange={(centered) => { centeredRef.current = centered; }} />
      <SwipeBackdrop progress={swipeProgress} />
      <View className="discover-screen__overlay"
        style={{ paddingTop: insets.top, paddingBottom: stackBottom }}
        pointerEvents="box-none">
        <View className="discover-screen__header">
          <ScreenHeader title="Explore" subtitle={`${feed.length} ${feed.length === 1 ? 'new event' : 'new events'} discovered matching your interests, availability, location, and commutable distance`} lightSubtitle />
          {__DEV__ && (
            <Pressable className="discover-screen__reset" onPress={reset}>
              <Text className="discover-screen__reset-label">Reset cards (testing)</Text>
            </Pressable>
          )}
        </View>
        <View className="discover-screen__body">
          {feed.length > 0 ? (
            <EventStack events={feed} swipeProgress={swipeProgress} onPressTop={handleCardPress} onPin={(event) => pin(event.id)} onArchive={(event) => archive(event.id)} />
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="You're all caught up"
              message="You've gone through every event for now. Check back soon for more."
            />
          )}
        </View>
      </View>
      <EventDetailModal event={feed[0]} visible={detailOpen} onClose={() => setDetailOpen(false)} />
    </View>
  );
}
