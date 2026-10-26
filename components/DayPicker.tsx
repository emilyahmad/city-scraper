import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { DAYS } from "@/data/preferences";

type DayPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

// Matches the p-1 padding of .day-picker, so touches can be mapped onto the day buttons.
const PADDING = 4;

// Days are stored as a comma-separated string, always in week order (e.g. "Fri, Sat, Sun").
export function DayPicker({ value, onChange }: DayPickerProps) {
  const selected = value.split(",").map((day) => day.trim());

  const emit = (days: string[]) => {
    const next = DAYS.filter((item) => days.includes(item)).join(", ");
    if (next !== value) onChange(next);
  };

  const toggle = (day: string) =>
    emit(
      selected.includes(day)
        ? selected.filter((item) => item !== day)
        : [...selected, day],
    );

  // Swiping paints every day between where the finger started and where it is now, using the first day's state:
  // starting on an unselected day selects the swept days, starting on a selected one clears them.
  const swipe = useRef({ base: selected, adding: true });
  const width = useSharedValue(0);
  const dayAt = (x: number) => {
    "worklet";
    const index = Math.floor(
      ((x - PADDING) / Math.max(width.value - PADDING * 2, 1)) * DAYS.length,
    );
    return Math.min(DAYS.length - 1, Math.max(0, index));
  };

  const startSwipe = (index: number) => {
    swipe.current = { base: selected, adding: !selected.includes(DAYS[index]) };
  };
  const paintSwipe = (from: number, to: number) => {
    const swept = DAYS.slice(Math.min(from, to), Math.max(from, to) + 1);
    const { base, adding } = swipe.current;
    emit(
      adding ? [...base, ...swept] : base.filter((day) => !swept.includes(day)),
    );
  };

  const startIndex = useSharedValue(0);
  // Last day the finger was over, so JS only hears about it when the finger crosses into a new day.
  const lastIndex = useSharedValue(-1);
  const swipeGesture = usePanGesture({
    // Horizontal drags only, so the sheet's swipe-down still works from here.
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onBegin: (event) => {
      "worklet";
      startIndex.set(dayAt(event.x));
      lastIndex.set(-1);
      scheduleOnRN(startSwipe, startIndex.value);
    },
    onUpdate: (event) => {
      "worklet";
      const index = dayAt(event.x);
      if (index === lastIndex.value) return;
      lastIndex.set(index);
      scheduleOnRN(paintSwipe, startIndex.value, index);
    },
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View
        className="day-picker"
        onLayout={(event) => width.set(event.nativeEvent.layout.width)}
      >
        {DAYS.map((day, index) => {
          const isSelected = selected.includes(day);
          // Neighbouring selected days fuse into one pill, so only the ends of a run are rounded.
          const joinsPrev = isSelected && selected.includes(DAYS[index - 1]);
          const joinsNext = isSelected && selected.includes(DAYS[index + 1]);
          const classes = ["day-picker__day"];
          if (isSelected) classes.push("day-picker__day--selected");
          if (isSelected && !joinsPrev) classes.push("day-picker__day--start");
          if (isSelected && !joinsNext) classes.push("day-picker__day--end");
          if (joinsPrev) classes.push("day-picker__day--joins-prev");

          return (
            <Pressable
              key={day}
              className={classes.join(" ")}
              onPress={() => toggle(day)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text className="day-picker__label">{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}
