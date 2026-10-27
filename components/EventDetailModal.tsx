import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView, useCompetingGestures, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { formatPlace, formatPrice, formatWhen } from '@/components/EventCard';
import { EventImage } from '@/components/EventImage';
import { SwipeBackdrop } from '@/components/SwipeBackdrop';
import { SOURCE_LABELS } from '@/constants/categories';
import { images } from '@/constants/images';
import type { EventItem } from '@/types/events';

type EventDetailModalProps = {
  event?: EventItem;
  visible: boolean;
  onClose: () => void;
  // Leave out to allow only swiping left (e.g. from the Pinned page, where the event is already pinned)
  onPin?: (event: EventItem) => void;
  onArchive: (event: EventItem) => void;
};

const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;
const FLING_VELOCITY = 800;

// Wrapped from RN's ScrollView (not Animated.ScrollView) so className keeps working under NativeWind.
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function EventDetailModal({ event, visible, onClose, onPin, onArchive }: EventDetailModalProps) {
  const { width, height } = useWindowDimensions();
  const swipeThreshold = width * 0.3;
  // Slide and fade are driven here instead of by the Modal's own "slide", which also dragged the dim
  // backdrop up and down as a visible rectangle behind the sheet.
  const dragY = useSharedValue(height);
  const dragX = useSharedValue(0);
  // -1..1, same as the feed's swipe, so the modal shows the same pin/archive colour wash
  const swipeProgress = useSharedValue(0);
  const [mounted, setMounted] = useState(false);
  const scrollOffset = useSharedValue(0);
  const startedAtTop = useSharedValue(true);

  useEffect(() => {
    if (visible) {
      scrollOffset.set(0);
      dragX.set(0);
      swipeProgress.set(0);
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

  const handleSwiped = (direction: 'pin' | 'archive') => {
    if (!event) return;
    if (direction === 'pin') onPin?.(event);
    else onArchive(event);
    onClose();
  };

  const canPin = !!onPin;

  // Swiping sideways works like the feed's cards: right pins, left archives, then the sheet closes.
  const swipeSideways = usePanGesture({
    activeOffsetX: canPin ? [-15, 15] : -15,
    failOffsetY: [-15, 15],
    onUpdate: (e) => {
      'worklet';
      const x = canPin ? e.translationX : Math.min(0, e.translationX);
      dragX.set(x);
      swipeProgress.set(Math.max(-1, Math.min(1, x / swipeThreshold)));
    },
    onDeactivate: (e) => {
      'worklet';
      const x = dragX.value;
      const toRight = x > swipeThreshold || (e.velocityX > FLING_VELOCITY && x > 20);
      const toLeft = x < -swipeThreshold || (e.velocityX < -FLING_VELOCITY && x < -20);

      if (toRight || toLeft) {
        dragX.set(
          withTiming((toRight ? 1 : -1) * width * 1.5, { duration: 200 }, (finished) => {
            if (finished) scheduleOnRN(handleSwiped, toRight ? 'pin' : 'archive');
          }),
        );
      } else {
        dragX.set(withSpring(0));
      }
      swipeProgress.set(withTiming(0, { duration: toRight || toLeft ? 300 : 200 }));
    },
  });

  const sheetGesture = useCompetingGestures(swipeDown, swipeSideways);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { rotate: `${interpolate(dragX.value, [-width, 0, width], [-6, 0, 6])}deg` },
    ],
  }));
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
        <SwipeBackdrop progress={swipeProgress} />
        <Pressable className="event-detail__backdrop" onPress={onClose} />
        {event && (
          <GestureDetector gesture={sheetGesture}>
            <Animated.View className="event-detail__card" style={cardStyle}>
              <Pressable className="event-detail__grabber" onPress={onClose}>
                <View className="event-detail__handle" />
              </Pressable>
              <Pressable className="event-detail__close" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </Pressable>
              <AnimatedScrollView showsVerticalScrollIndicator={false} contentContainerClassName="event-detail__content" onScroll={onScroll} scrollEventThrottle={16}>
                {/* expo-image doesn't pick up className here, so the wrapper carries the layout and the image just fills it. */}
                <View className="event-detail__image">
                  <EventImage event={event} iconSize={56} />
                </View>
                <View className="event-detail__header">
                  <Text
                    className="event-detail__title"
                    accessibilityRole="link"
                    accessibilityLabel="Open event page"
                    onPress={() => Linking.openURL(event.externalUrl).catch(() => {})}>
                    {titleHead}
                    {/* The icon is inline after the last word so it follows the title when it wraps. */}
                    <Text>
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
                <Text className="event-detail__when">{formatWhen(event.startAt, event.endAt)}</Text>
                <Text className="event-detail__meta">
                  {[formatPlace(event), formatPrice(event.price), event.distanceMiles !== undefined && `${event.distanceMiles} mi away`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {/* Credits the site the event was found on; tapping the title opens it there */}
                <Text className="event-detail__source">Listed on {SOURCE_LABELS[event.source]}</Text>
                {!!event.description && (
                  <>
                    <Text className="event-detail__section">About Event</Text>
                    <Text className="mt-4 text-base text-white">{event.description}</Text>
                  </>
                )}
              </AnimatedScrollView>
            </Animated.View>
          </GestureDetector>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
