import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EventCard } from '@/components/EventCard';
import type { EventItem } from '@/types/events';

type SwipeableEventCardProps = {
  event: EventItem;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
};

const FLING_VELOCITY = 800;

export function SwipeableEventCard({ event, onSwipeRight, onSwipeLeft }: SwipeableEventCardProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const threshold = width * 0.3;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const toRight = translateX.value > threshold || (e.velocityX > FLING_VELOCITY && translateX.value > 20);
      const toLeft = translateX.value < -threshold || (e.velocityX < -FLING_VELOCITY && translateX.value < -20);

      if (toRight) {
        translateX.value = withTiming(width * 1.5, { duration: 200 }, (finished) => {
          if (finished) scheduleOnRN(onSwipeRight);
        });
      } else if (toLeft) {
        translateX.value = withTiming(-width * 1.5, { duration: 200 }, (finished) => {
          if (finished) scheduleOnRN(onSwipeLeft);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-width, 0, width], [-12, 0, 12])}deg` },
    ],
  }));

  const pinLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], 'clamp'),
  }));

  const archiveLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={cardStyle}>
        <EventCard event={event} />
        <Animated.View style={pinLabelStyle} className="swipe-label swipe-label--pin">
          <Text className="swipe-label__text swipe-label__text--pin">PIN</Text>
        </Animated.View>
        <Animated.View style={archiveLabelStyle} className="swipe-label swipe-label--archive">
          <Text className="swipe-label__text swipe-label__text--archive">ARCHIVE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
