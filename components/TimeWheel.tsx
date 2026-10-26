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
};

// One scrolling column that snaps to a row; rows fade out the further they are from the highlighted middle.
export function TimeWheel({ options, index, onChange }: TimeWheelProps) {
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
    if (next !== index) onChange(next);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      className="time-wheel"
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
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
        <TimeWheelRow key={label} label={label} position={i} scrollY={scrollY} />
      ))}
    </Animated.ScrollView>
  );
}

function TimeWheelRow({
  label,
  position,
  scrollY,
}: {
  label: string;
  position: number;
  scrollY: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / ITEM_HEIGHT - position);
    return {
      opacity: interpolate(distance, [0, 1, 2, 3], [1, 0.55, 0.3, 0.1], 'clamp'),
      transform: [{ scale: interpolate(distance, [0, 2], [1, 0.8], 'clamp') }],
    };
  });

  return (
    <Animated.View style={style} className="time-wheel__row">
      <Text className="time-wheel__label">{label}</Text>
    </Animated.View>
  );
}
