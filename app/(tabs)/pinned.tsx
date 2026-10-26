import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EVENTS } from '@/data/events';
import { useEventsStore } from '@/store/events';

export default function PinnedScreen() {
  const pinnedIds = useEventsStore((state) => state.pinnedIds);
  const unpin = useEventsStore((state) => state.unpin);
  const clearNewPin = useEventsStore((state) => state.clearNewPin);

  // Opening the tab counts as seeing the new pin
  useFocusEffect(
    useCallback(() => {
      clearNewPin();
    }, [clearNewPin]),
  );

  const pinned = EVENTS.filter((event) => pinnedIds.includes(event.id)).sort((a, b) =>
    a.startAt.localeCompare(b.startAt),
  );

  return (
    <SafeAreaView edges={['top']} className="tab-screen">
      <ScrollView contentContainerClassName="tab-screen__content">
        <ScreenHeader title="Pinned" subtitle="Your saved events" />
        {pinned.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="Nothing pinned yet"
            message="Swipe right on an event to pin it and it will show up here."
          />
        ) : (
          pinned.map((event) => (
            <View key={event.id} className="pinned-item">
              <EventCard event={event} />
              <Pressable className="pinned-item__unpin" onPress={() => unpin(event.id)}>
                <Text className="pinned-item__unpin-label">Unpin</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
