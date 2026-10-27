import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import Animated, {
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DayPicker } from "@/components/DayPicker";
import { TimeWheel } from "@/components/TimeWheel";
import { DAYS } from "@/data/preferences";
import { usePressScale } from "@/hooks/usePressScale";
import {
  formatRanges,
  parseRanges,
  type Time,
  type TimeRange,
} from "@/lib/times";

type TimeRangePickerProps = {
  value: string;
  // The sheet's main days, which the first slot uses; new slots default to the days not covered here.
  days: string;
  scrollOffset: SharedValue<number>;
  // Where the surrounding scroll view is, put back in scrollOffset when a wheel touch ends.
  restoreOffset: SharedValue<number>;
  // Changing this closes the open time wheel (the sheet bumps it on save).
  closeSignal: number;
  onChange: (value: string) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_STEP = 15;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  String(i * MINUTE_STEP).padStart(2, "0"),
);
const PERIODS = ["AM", "PM"];

const toDate = ({ hour, minute, period }: Time) => {
  const date = new Date();
  date.setHours((hour % 12) + (period === "PM" ? 12 : 0), minute, 0, 0);
  return date;
};

const fromDate = (date: Date): Time => {
  const h = date.getHours();
  return {
    hour: h % 12 || 12,
    minute: date.getMinutes(),
    period: h >= 12 ? "PM" : "AM",
  };
};

const SLOTS = [
  { key: "start", label: "From" },
  { key: "end", label: "Until" },
] as const;

// Each timeslot is a From/Until pair; tapping one reveals the wheels to edit it, and tapping it again hides them.
export function TimeRangePicker({
  value,
  days,
  scrollOffset,
  restoreOffset,
  closeSignal,
  onChange,
}: TimeRangePickerProps) {
  const [selected, setSelected] = useState<{
    index: number;
    key: (typeof SLOTS)[number]["key"];
  } | null>(null);
  const [seenSignal, setSeenSignal] = useState(closeSignal);
  if (seenSignal !== closeSignal) {
    setSeenSignal(closeSignal);
    setSelected(null);
  }
  const ranges = parseRanges(value);
  const time = selected ? ranges[selected.index]?.[selected.key] : null;
  // The iOS wheel takes the place of the Remove and Add buttons while a time is being edited.
  const hideActions = Platform.OS === "ios" && !!time;

  const update = (patch: Partial<Time>) => {
    if (!selected || !time) return;
    onChange(
      formatRanges(
        ranges.map((range, i) =>
          i === selected.index
            ? { ...range, [selected.key]: { ...time, ...patch } }
            : range,
        ),
      ),
    );
  };

  // A new slot starts where the last one ends and runs for an hour.
  const addSlot = () => {
    const start = ranges[ranges.length - 1].end;
    const end = toDate(start);
    end.setHours(end.getHours() + 1);
    const taken = days.split(",").map((day) => day.trim());
    const free = DAYS.filter((day) => !taken.includes(day));
    const next: TimeRange = {
      start,
      end: fromDate(end),
      days: (free.length ? free : ["Sat", "Sun"]).join(", "),
    };
    onChange(formatRanges([...ranges, next]));
    setSelected(null);
  };

  const removeSlot = (index: number) => {
    onChange(formatRanges(ranges.filter((_, i) => i !== index)));
    setSelected(null);
  };

  return (
    <View className="time-range">
      {ranges.map((range, index) => (
        <View key={index} className={index ? "time-range__row" : undefined}>
          {range.days !== undefined ? (
            <View className="time-range__days">
              <DayPicker
                value={range.days}
                onChange={(next) =>
                  onChange(
                    formatRanges(
                      ranges.map((item, i) =>
                        i === index ? { ...item, days: next } : item,
                      ),
                    ),
                  )
                }
              />
            </View>
          ) : null}
          <View className="time-range__slots">
            {SLOTS.map(({ key, label }) => {
              const { hour, minute, period } = range[key];
              const active = selected?.index === index && selected.key === key;
              return (
                <TimeSlot
                  key={key}
                  label={label}
                  time={`${hour}:${String(minute).padStart(2, "0")} ${period}`}
                  active={active}
                  onPress={() => setSelected(active ? null : { index, key })}
                />
              );
            })}
          </View>
          {index && index === ranges.length - 1 && !hideActions ? (
            <Pressable
              className="time-range__remove"
              onPress={() => removeSlot(index)}
              hitSlop={8}
            >
              <Text className="time-range__add-label">Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {hideActions ? null : (
        <Pressable className="time-range__add" onPress={addSlot} hitSlop={8}>
          <Text className="time-range__add-label">Add a new timeslot</Text>
        </Pressable>
      )}
      {/* With one slot, space for the wheels is always reserved so the Save button doesn't jump. With more, the sheet scrolls, so the space only exists while a wheel is open. */}
      <View
        className={
          ranges.length > 1
            ? time
              ? "time-range__wheel-space--auto"
              : undefined
            : hideActions
              ? "time-range__wheel-space time-range__wheel-space--raised"
              : "time-range__wheel-space"
        }
      >
        {time ? (
          // The sheet's swipe-down gesture must not steal vertical drags meant for the wheels.
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(120)}
            className="time-range__wheels"
            onTouchStart={() => scrollOffset.set(1)}
            onTouchEnd={() => scrollOffset.set(restoreOffset.value)}
            onTouchCancel={() => scrollOffset.set(restoreOffset.value)}
          >
            {Platform.OS === "ios" ? (
              // The real iOS wheel; it shows every minute, since UIDatePicker's interval isn't exposed.
              <View className="time-range__native">
                <DateTimePicker
                  key={`${selected?.index}-${selected?.key}`}
                  mode="time"
                  display="spinner"
                  themeVariant="dark"
                  value={toDate(time)}
                  onValueChange={(_, date) => update(fromDate(date))}
                  style={{ alignSelf: "stretch", height: 216 }}
                />
              </View>
            ) : (
              <>
                <View className="time-range__highlight" pointerEvents="none" />
                <View className="time-range__column">
                  <TimeWheel
                    options={HOURS}
                    align="end"
                    index={time.hour - 1}
                    onChange={(i) => update({ hour: i + 1 })}
                  />
                </View>
                <View className="time-range__column">
                  <TimeWheel
                    options={MINUTES}
                    align="start"
                    // A saved minute that isn't on the step (e.g. :53) snaps to the nearest option.
                    index={Math.min(
                      MINUTES.length - 1,
                      Math.round(time.minute / MINUTE_STEP),
                    )}
                    onChange={(i) => update({ minute: i * MINUTE_STEP })}
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
              </>
            )}
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
