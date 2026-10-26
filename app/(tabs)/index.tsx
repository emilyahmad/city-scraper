import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventMap } from '@/components/EventMap';
import { EventStack } from '@/components/EventStack';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EVENTS } from '@/data/events';
import { useEventsStore } from '@/store/events';

// Floating tab bar: ~72px tall, sitting `max(bottom inset, 12)` above the screen edge
const TAB_BAR_HEIGHT = 72;
const GAP_ABOVE_TAB_BAR = 10;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const stackBottom = Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + GAP_ABOVE_TAB_BAR;
  const pinnedIds = useEventsStore((state) => state.pinnedIds);
  const archivedIds = useEventsStore((state) => state.archivedIds);
  const pin = useEventsStore((state) => state.pin);
  const archive = useEventsStore((state) => state.archive);
  const reset = useEventsStore((state) => state.reset);

  const feed = EVENTS.filter((event) => !pinnedIds.includes(event.id) && !archivedIds.includes(event.id));

  return (
    <View className="discover-screen">
      <EventMap events={feed} activeId={feed[0]?.id} />
      <SafeAreaView edges={['top']} className="discover-screen__overlay"
        style={{ paddingBottom: stackBottom }}
        pointerEvents="box-none">
        <View className="discover-screen__header">
          <ScreenHeader title="Discover" subtitle="Upcoming events picked for you" lightSubtitle />
          {__DEV__ && (
            <Pressable className="discover-screen__reset" onPress={reset}>
              <Text className="discover-screen__reset-label">Reset cards (testing)</Text>
            </Pressable>
          )}
        </View>
        <View className="discover-screen__body">
          {feed.length > 0 ? (
            <EventStack events={feed} onPin={(event) => pin(event.id)} onArchive={(event) => archive(event.id)} />
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="You're all caught up"
              message="You've gone through every event for now. Check back soon for more."
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
