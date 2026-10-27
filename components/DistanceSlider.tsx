import { useEffect } from "react";
import { Text, View } from "react-native";
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { DISTANCE_MAX, DISTANCE_MIN, DISTANCE_STEP } from "@/data/preferences";

type DistanceSliderProps = {
  value: string;
  onChange: (value: string) => void;
};

// Matches the h-7 w-7 of .distance-slider__thumb.
const THUMB_SIZE = 28;
const STOPS = (DISTANCE_MAX - DISTANCE_MIN) / DISTANCE_STEP;
const SNAP = { duration: 180, easing: Easing.out(Easing.cubic) };

/** Saved values are free text, so anything outside the slider's range (or not a number) snaps back into it. */
function toMiles(value: string) {
  const miles = Math.round(Number(value) / DISTANCE_STEP) * DISTANCE_STEP;
  if (!Number.isFinite(miles) || value.trim() === "") return DISTANCE_MIN;
  return Math.min(DISTANCE_MAX, Math.max(DISTANCE_MIN, miles));
}

export function DistanceSlider({ value, onChange }: DistanceSliderProps) {
  const miles = toMiles(value);
  const stop = (miles - DISTANCE_MIN) / DISTANCE_STEP;

  // How far the thumb can travel: the track minus one thumb, so it never hangs off either end.
  const travel = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragging = useSharedValue(false);
  // Last stop sent to JS, so the label only re-renders when the finger crosses into a new one.
  const lastStop = useSharedValue(stop);

  const stopAt = (x: number) => {
    "worklet";
    const index = Math.round((x / Math.max(travel.value, 1)) * STOPS);
    return Math.min(STOPS, Math.max(0, index));
  };
  const xFor = (index: number) => {
    "worklet";
    return (index / STOPS) * travel.value;
  };

  const emit = (index: number) => {
    const next = String(DISTANCE_MIN + index * DISTANCE_STEP);
    if (next !== value) onChange(next);
  };
  const report = (index: number) => {
    "worklet";
    if (index === lastStop.value) return;
    lastStop.set(index);
    scheduleOnRN(emit, index);
  };

  // Follows outside changes (opening the sheet, a saved value) but never fights the finger mid-drag.
  // Runs on the UI thread, where travel and dragging are current. Before layout travel is 0, and onLayout places the thumb instead.
  useEffect(() => {
    scheduleOnUI(() => {
      "worklet";
      lastStop.set(stop);
      if (!dragging.value && travel.value > 0) {
        thumbX.set(withTiming(xFor(stop), SNAP));
      }
    });
    // xFor only reads shared values, so it doesn't need to be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, dragging, lastStop, thumbX, travel]);

  // Dragging moves the thumb smoothly with the finger, from wherever it is, and it settles on the nearest stop on release.
  const pan = usePanGesture({
    // Horizontal drags only, so the sheet's swipe-down still works from here.
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: () => {
      "worklet";
      dragging.set(true);
      dragStartX.set(thumbX.value);
    },
    onUpdate: (event) => {
      "worklet";
      const x = Math.min(
        travel.value,
        Math.max(0, dragStartX.value + event.translationX),
      );
      thumbX.set(x);
      report(stopAt(x));
    },
    onDeactivate: () => {
      "worklet";
      dragging.set(false);
      thumbX.set(withTiming(xFor(stopAt(thumbX.value)), SNAP));
    },
  });

  // Tapping the track jumps straight to the nearest stop.
  const tap = useTapGesture({
    onDeactivate: (event) => {
      "worklet";
      const index = stopAt(event.x - THUMB_SIZE / 2);
      thumbX.set(withTiming(xFor(index), SNAP));
      report(index);
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));
  // The track is inset by half a thumb on each side, so the fill ends under the thumb's centre.
  const fillStyle = useAnimatedStyle(() => ({ width: thumbX.value }));

  return (
    <View className="distance-slider">
      <View className="distance-slider__header">
        <Text className="distance-slider__label">Distance</Text>
        <Text className="distance-slider__value">{miles} miles</Text>
      </View>
      <GestureDetector gesture={gesture}>
        <View
          className="distance-slider__track-area"
          onLayout={(event) => {
            // Uses the width directly: reading travel back on the JS thread would still return the old value.
            const width = Math.max(event.nativeEvent.layout.width - THUMB_SIZE, 0);
            travel.set(width);
            thumbX.set((stop / STOPS) * width);
          }}
          accessibilityRole="adjustable"
          accessibilityLabel="Distance"
          accessibilityValue={{ text: `${miles} miles` }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) => {
            const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
            emit(Math.min(STOPS, Math.max(0, stop + delta)));
          }}
        >
          <View className="distance-slider__track">
            <Animated.View
              className="distance-slider__fill"
              style={fillStyle}
            />
          </View>
          <Animated.View className="distance-slider__thumb" style={thumbStyle} />
        </View>
      </GestureDetector>
      <View className="distance-slider__range">
        <Text className="distance-slider__range-label">{DISTANCE_MIN} mi</Text>
        <Text className="distance-slider__range-label">{DISTANCE_MAX} mi</Text>
      </View>
    </View>
  );
}
