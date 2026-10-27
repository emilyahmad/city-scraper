import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EventCard } from '@/components/EventCard';
import type { EventItem } from '@/types/events';

type SwipeableEventCardProps = {
  event: EventItem;
  // Leave out to allow only left swipes (e.g. the Pinned list, where the card sits in a vertical scroll)
  onSwipeRight?: () => void;
  onSwipeLeft: () => void;
  onPress?: () => void;
  // -1..1 drag progress, drives the screen backdrop
  swipeProgress?: SharedValue<number>;
};

// Kept low so the stack can be swiped through quickly: a short flick commits, and the card
// leaves fast because the next card only becomes swipeable once this one is gone.
const FLING_VELOCITY = 450;
const EXIT_MS = 130;
// The Pinned list only archives, so it takes a shorter drag, a softer flick and a quicker exit.
const LEFT_ONLY_FLING_VELOCITY = 250;
const LEFT_ONLY_EXIT_MS = 80;
const LEFT_ONLY_THRESHOLD_RATIO = 0.12;
const ARCHIVE_GAP = 10;
const ARCHIVE_ICON_SIZE = 28;

export function SwipeableEventCard({ event, onSwipeRight, onSwipeLeft, onPress, swipeProgress }: SwipeableEventCardProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const canSwipeRight = !!onSwipeRight;
  const threshold = width * (canSwipeRight ? 0.22 : LEFT_ONLY_THRESHOLD_RATIO);
  const flingVelocity = canSwipeRight ? FLING_VELOCITY : LEFT_ONLY_FLING_VELOCITY;
  const exitMs = canSwipeRight ? EXIT_MS : LEFT_ONLY_EXIT_MS;

  const pan = Gesture.Pan()
    .activeOffsetX(canSwipeRight ? [-10, 10] : -6)
    .onUpdate((e) => {
      translateX.value = canSwipeRight ? e.translationX : Math.min(0, e.translationX);
      swipeProgress?.set(Math.max(-1, Math.min(1, translateX.value / threshold)));
    })
    .onEnd((e) => {
      const toRight = translateX.value > threshold || (e.velocityX > flingVelocity && translateX.value > 20);
      const toLeft = translateX.value < -threshold || (e.velocityX < -flingVelocity && translateX.value < -20);

      if (toRight && onSwipeRight) {
        translateX.value = withTiming(width * 1.5, { duration: exitMs }, (finished) => {
          if (finished) scheduleOnRN(onSwipeRight);
        });
        swipeProgress?.set(withTiming(0, { duration: 300 }));
      } else if (toLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: exitMs }, (finished) => {
          if (finished) scheduleOnRN(onSwipeLeft);
        });
        swipeProgress?.set(withTiming(0, { duration: 300 }));
      } else {
        translateX.value = withSpring(0);
        swipeProgress?.set(withTiming(0, { duration: 200 }));
      }
    });
  // Left-only cards live in a scroll view, so a mostly vertical drag should scroll instead
  if (!canSwipeRight) pan.failOffsetY([-15, 15]);

  const tap =Gesture.Tap().onEnd((_e, success) => {
    if (success && onPress) scheduleOnRN(onPress);
  });

  const gesture = Gesture.Race(pan, tap);

  // Left-only cards slide flat so the archive panel's edge stays parallel to the card
  const cardStyle =useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${canSwipeRight ? interpolate(translateX.value, [-width, 0, width], [-6, 0, 6]) : 0}deg` },
    ],
  }));

  // Fills the space the card uncovers, leaving a small gap between the two
  const archiveStyle = useAnimatedStyle(() => {
    const revealed = Math.max(0, -translateX.value - ARCHIVE_GAP);
    return {
      width: revealed,
      opacity: interpolate(revealed, [0, ARCHIVE_ICON_SIZE * 2], [0, 1], 'clamp'),
    };
  });

  return (
    <View>
      {!canSwipeRight && (
        <Animated.View className="swipe-card__archive" style={archiveStyle}>
          <Ionicons name="close" size={ARCHIVE_ICON_SIZE} color="#ffffff" />
        </Animated.View>
      )}
      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <EventCard event={event} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
