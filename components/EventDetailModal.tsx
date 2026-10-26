import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { formatWhen } from '@/components/EventCard';
import { images } from '@/constants/images';
import type { EventItem } from '@/types/events';

type EventDetailModalProps = {
  event?: EventItem;
  visible: boolean;
  onClose: () => void;
};

const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

// Wrapped from RN's ScrollView (not Animated.ScrollView) so className keeps working under NativeWind.
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function EventDetailModal({ event, visible, onClose }: EventDetailModalProps) {
  const { height } = useWindowDimensions();
  // Slide and fade are driven here instead of by the Modal's own "slide", which also dragged the dim
  // backdrop up and down as a visible rectangle behind the sheet.
  const dragY = useSharedValue(height);
  const [mounted, setMounted] = useState(false);
  const scrollOffset = useSharedValue(0);
  const startedAtTop = useSharedValue(true);

  useEffect(() => {
    if (visible) {
      scrollOffset.set(0);
      dragY.set(height);
      setMounted(true);
      dragY.set(withTiming(0, { duration: 300 }));
    } else {
      dragY.set(
        withTiming(height, { duration: 250 }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollOffset.set(e.contentOffset.y);
  });

  // Dragging down moves the sheet with the finger; letting go past the threshold (or flicking) closes it.
  const swipeDown = usePanGesture({
    activeOffsetY: 10,
    failOffsetX: [-20, 20],
    onBegin: () => {
      'worklet';
      // A drag that starts while the text is scrolled belongs to the scroll view, not the sheet.
      startedAtTop.set(scrollOffset.value <= 0);
    },
    onUpdate: (e) => {
      'worklet';
      if (!startedAtTop.value) return;
      dragY.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (!startedAtTop.value) return;
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        dragY.set(withTiming(0, { duration: 200 }));
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));
  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragY.value, [0, height], [1, 0], 'clamp'),
  }));

  const titleWords = event?.title.split(' ') ?? [];
  const titleLast = titleWords.pop() ?? '';
  const titleHead = titleWords.length ? `${titleWords.join(' ')} ` : '';

  return (
    <Modal visible={mounted && !!event} animationType="none" transparent onRequestClose={onClose}>
      <GestureHandlerRootView className="event-detail">
        <Animated.View pointerEvents="none" style={dimStyle} className="event-detail__dim" />
        <Pressable className="event-detail__backdrop" onPress={onClose} />
        {event && (
          <GestureDetector gesture={swipeDown}>
            <Animated.View className="event-detail__card" style={cardStyle}>
              <Pressable className="event-detail__grabber" onPress={onClose}>
                <View className="event-detail__handle" />
              </Pressable>
              <Pressable className="event-detail__close" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </Pressable>
              <AnimatedScrollView contentContainerClassName="event-detail__content" onScroll={onScroll} scrollEventThrottle={16}>
                {/* expo-image doesn't pick up className here, so the wrapper carries the layout and the image just fills it. */}
                <View className="event-detail__image">
                  <Image source={{ uri: event.imageUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                </View>
                <View className="event-detail__header">
                  <Text className="event-detail__title">
                    {titleHead}
                    {/* The icon is inline after the last word so it follows the title when it wraps. */}
                    <Text accessibilityRole="link" accessibilityLabel="Open event page">
                      {titleLast}
                      {'  '}
                      <Image
                        source={images.externalLinkIcon}
                        tintColor="#ffffff"
                        contentFit="contain"
                        style={{ width: 20, height: 20, transform: [{ translateY: -3 }] }}
                      />
                    </Text>
                  </Text>
                </View>
                <Text className="event-detail__host">{event.host}</Text>
                <Text className="event-detail__when">{formatWhen(event.startAt)}</Text>
                <Text className="event-detail__meta">
                  {event.venue} · {event.neighborhood} · {event.price === 0 ? 'Free' : `$${event.price}`}
                </Text>
                <Text className="event-detail__section">About Event</Text>
                <Text className="mt-4 text-base text-white">{event.description}</Text>
              </AnimatedScrollView>
            </Animated.View>
          </GestureDetector>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
