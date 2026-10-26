import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useWindowDimensions } from 'react-native';
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
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onPress?: () => void;
  // -1..1 drag progress, drives the screen backdrop
  swipeProgress: SharedValue<number>;
};

const FLING_VELOCITY = 800;

export function SwipeableEventCard({ event, onSwipeRight, onSwipeLeft, onPress, swipeProgress }: SwipeableEventCardProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const threshold = width * 0.3;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      swipeProgress.set(Math.max(-1, Math.min(1, e.translationX / threshold)));
    })
    .onEnd((e) => {
      const toRight = translateX.value > threshold || (e.velocityX > FLING_VELOCITY && translateX.value > 20);
      const toLeft = translateX.value < -threshold || (e.velocityX < -FLING_VELOCITY && translateX.value < -20);

      if (toRight) {
        translateX.value = withTiming(width * 1.5, { duration: 200 }, (finished) => {
          if (finished) scheduleOnRN(onSwipeRight);
        });
        swipeProgress.set(withTiming(0, { duration: 300 }));
      } else if (toLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: 200 }, (finished) => {
          if (finished) scheduleOnRN(onSwipeLeft);
        });
        swipeProgress.set(withTiming(0, { duration: 300 }));
      } else {
        translateX.value = withSpring(0);
        swipeProgress.set(withTiming(0, { duration: 200 }));
      }
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success && onPress) scheduleOnRN(onPress);
  });

  const gesture = Gesture.Race(pan, tap);

  const cardStyle =useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-width, 0, width], [-6, 0, 6])}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={cardStyle}>
        <EventCard event={event} />
      </Animated.View>
    </GestureDetector>
  );
}
