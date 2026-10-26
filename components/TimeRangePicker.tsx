import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { TimeWheel } from "@/components/TimeWheel";
import { usePressScale } from "@/hooks/usePressScale";
import { formatRange, parseRange, type Time } from "@/lib/times";

type TimeRangePickerProps = {
  value: string;
  scrollOffset: SharedValue<number>;
  onChange: (value: string) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const PERIODS = ["AM", "PM"];

const SLOTS = [
  { key: "start", label: "From" },
  { key: "end", label: "Until" },
] as const;

// Two time slots (start and end); tapping one reveals the wheels to edit it, and tapping it again hides them.
export function TimeRangePicker({
  value,
  scrollOffset,
  onChange,
}: TimeRangePickerProps) {
  const [slot, setSlot] = useState<(typeof SLOTS)[number]["key"] | null>(null);
  const range = parseRange(value);
  const time = slot ? range[slot] : null;

  const update = (patch: Partial<Time>) => {
    if (!slot || !time) return;
    onChange(formatRange({ ...range, [slot]: { ...time, ...patch } }));
  };

  return (
    <View className="time-range">
      <View className="time-range__slots">
        {SLOTS.map(({ key, label }) => {
          const { hour, minute, period } = range[key];
          const active = key === slot;
          return (
            <TimeSlot
              key={key}
              label={label}
              time={`${hour}:${String(minute).padStart(2, "0")} ${period}`}
              active={active}
              onPress={() => setSlot(active ? null : key)}
            />
          );
        })}
      </View>
      {/* Space for the wheels is always reserved, so the Save button doesn't jump when they appear. */}
      <View className="time-range__wheel-space">
        {time ? (
          // The sheet's swipe-down gesture must not steal vertical drags meant for the wheels.
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(120)}
            className="time-range__wheels"
            onTouchStart={() => scrollOffset.set(1)}
            onTouchEnd={() => scrollOffset.set(0)}
            onTouchCancel={() => scrollOffset.set(0)}
          >
            <View className="time-range__highlight" pointerEvents="none" />
            <View className="time-range__column">
              <TimeWheel
                options={HOURS}
                index={time.hour - 1}
                onChange={(i) => update({ hour: i + 1 })}
              />
            </View>
            <View className="time-range__column">
              <TimeWheel
                options={MINUTES}
                index={time.minute}
                onChange={(i) => update({ minute: i })}
              />
            </View>
            <View className="time-range__column">
              <TimeWheel
                options={PERIODS}
                index={PERIODS.indexOf(time.period)}
                onChange={(i) =>
                  update({ period: PERIODS[i] as Time["period"] })
                }
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

type TimeSlotProps = {
  label: string;
  time: string;
  active: boolean;
  onPress: () => void;
};

// The highlight fades in and out instead of switching, so choosing a slot feels continuous.
function TimeSlot({ label, time, active, onPress }: TimeSlotProps) {
  const { scaleStyle, pressHandlers } = usePressScale();
  const highlight = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    highlight.set(withTiming(active ? 1 : 0, { duration: 180 }));
  }, [active, highlight]);
  const highlightStyle = useAnimatedStyle(() => ({ opacity: highlight.value }));

  return (
    <Animated.View style={[{ flex: 1 }, scaleStyle]}>
      <Pressable
        className="time-range__slot"
        onPress={onPress}
        {...pressHandlers}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <View className="time-range__slot-fill" pointerEvents="none">
          <Animated.View style={[{ flex: 1 }, highlightStyle]}>
            <View className="time-range__slot-highlight" />
          </Animated.View>
        </View>
        <View className="time-range__slot-text">
          <Text className="time-range__slot-label">{label}</Text>
          <Text className="time-range__slot-time">{time}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
