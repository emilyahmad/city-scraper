import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_COUNT = 3;
const STAGGER_MS = 160;
const PULSE_MS = 400;

function Dot({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: (DOT_COUNT - 1 - index) * STAGGER_MS }),
        ),
        -1,
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.7,
    transform: [{ scale: 0.8 + progress.value * 0.4 }],
  }));

  return <Animated.View className="loading-dots__dot" style={style} />;
}

export function LoadingDots() {
  return (
    <View className="loading-dots" accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <Dot key={index} index={index} />
      ))}
    </View>
  );
}
