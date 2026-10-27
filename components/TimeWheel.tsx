import { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

type TimeWheelProps = {
  options: string[];
  index: number;
  onChange: (index: number) => void;
  // Which edge the labels hug. Hours use "end" and minutes "start" so they sit either side of the colon, like the iOS picker.
  align?: 'start' | 'center' | 'end';
};

const ORIGINS = { start: 'left center', center: 'center', end: 'right center' } as const;

// One scrolling column that snaps to a row; rows fade out the further they are from the highlighted middle.
export function TimeWheel({ options, index, onChange, align = 'center' }: TimeWheelProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(index * ITEM_HEIGHT);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  // Jump to the new row when the value changes from outside (e.g. switching between the start and end slot).
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
  }, [index]);

  const handleEnd = (offsetY: number) => {
    const next = Math.min(options.length - 1, Math.max(0, Math.round(offsetY / ITEM_HEIGHT)));
    // Re-center explicitly: when the row didn't change, the effect below doesn't run and a fast flick can rest between rows.
    scrollRef.current?.scrollTo({ y: next * ITEM_HEIGHT, animated: true });
    if (next !== index) onChange(next);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      className="time-wheel"
      showsVerticalScrollIndicator={false}
      snapToOffsets={options.map((_, i) => i * ITEM_HEIGHT)}
      snapToAlignment="start"
      disableIntervalMomentum
      decelerationRate="fast"
      contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
      contentContainerStyle={{ paddingVertical: PADDING }}
      scrollEventThrottle={16}
      onScroll={onScroll}
      onMomentumScrollEnd={(event) => handleEnd(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(event) => {
        // A slow drag can end with no momentum; snapToInterval still settles on a row.
        if (!event.nativeEvent.velocity?.y) handleEnd(event.nativeEvent.contentOffset.y);
      }}
    >
      {options.map((label, i) => (
        <TimeWheelRow key={label} label={label} position={i} scrollY={scrollY} align={align} />
      ))}
    </Animated.ScrollView>
  );
}

function TimeWheelRow({
  label,
  position,
  scrollY,
  align,
}: {
  label: string;
  position: number;
  scrollY: SharedValue<number>;
  align: NonNullable<TimeWheelProps['align']>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / ITEM_HEIGHT - position);
    return {
      // Scale from the aligned edge so shrinking rows don't drift away from it.
      transformOrigin: ORIGINS[align],
      opacity: interpolate(distance, [0, 1, 2, 3], [1, 0.55, 0.3, 0.1], 'clamp'),
      transform: [{ scale: interpolate(distance, [0, 2], [1, 0.8], 'clamp') }],
    };
  });

  return (
    <Animated.View style={style} className={`time-wheel__row time-wheel__row--${align}`}>
      <Text className="time-wheel__label">{label}</Text>
    </Animated.View>
  );
}
