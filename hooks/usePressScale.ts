import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Quick shrink while a button is held and an eased return on release, driven on the UI thread so it never waits on a re-render.
export function usePressScale(pressedScale = 0.96) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    scaleStyle,
    pressHandlers: {
      onPressIn: () => scale.set(withTiming(pressedScale, { duration: 80 })),
      onPressOut: () => scale.set(withTiming(1, { duration: 160 })),
    },
  };
}
