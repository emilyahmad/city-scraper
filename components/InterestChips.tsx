import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { type SharedValue, ZoomIn, useAnimatedScrollHandler } from 'react-native-reanimated';

import { INTEREST_OPTIONS, RELATED_INTERESTS } from '@/data/preferences';

// Wrapped from RN's ScrollView (not Animated.ScrollView) so className keeps working under NativeWind.
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const SUGGESTIONS_PER_TAP = 2;
// The grid grows with new suggestions until it takes this share of the screen, then scrolls.
const MAX_HEIGHT_RATIO = 0.55;
// The grid runs this far past its layout box, under the save button and the sheet's bottom padding, so chips scroll to the sheet's edge.
// The matching negative margin and content padding keep the sheet's height and the last row's resting position unchanged.
const BOTTOM_OVERLAP = 112;
// Room under the footer (e.g. the quiz's Finish button) once the grid is long enough to scroll
const FOOTER_GAP = 32;

type InterestChipsProps = {
  /** Comma-separated interests, the same format the preferences store uses */
  value: string;
  onChange: (value: string) => void;
  /** Mirrors the grid's scroll position so the sheet's swipe-to-close can tell when the grid is scrolled */
  scrollOffset: SharedValue<number>;
  /** Scrolls with the grid, on its own row below the last chip (e.g. a continue button). Without it, the grid runs under whatever sits below it. */
  footer?: ReactNode;
};

const parseInterests = (value: string) =>
  value
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean);

export function InterestChips({ value, onChange, scrollOffset, footer }: InterestChipsProps) {
  const { height } = useWindowDimensions();
  // Tracked on the UI thread so scrolling never waits on the JS thread.
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollOffset.set(event.contentOffset.y);
  });
  const selected = parseInterests(value);
  // Keep interests saved before the chip picker existed visible, so they can still be removed.
  const [options, setOptions] = useState(() => [
    ...INTEREST_OPTIONS,
    ...selected.filter((interest) => !INTEREST_OPTIONS.includes(interest)),
  ]);
  // Only chips added after opening animate in, so the initial grid doesn't all pop at once.
  const [initialOptions] = useState(options);

  // Suggests similar interests right after the tapped chip, skipping any already shown.
  const suggestFor = (interest: string) => {
    const fresh = (RELATED_INTERESTS[interest] ?? [])
      .filter((related) => !options.includes(related))
      .slice(0, SUGGESTIONS_PER_TAP);
    if (fresh.length === 0) return;
    const index = options.indexOf(interest) + 1;
    setOptions([...options.slice(0, index), ...fresh, ...options.slice(index)]);
  };

  const toggle = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((item) => item !== interest).join(', '));
      return;
    }
    onChange([...selected, interest].join(', '));
    suggestFor(interest);
  };

  return (
    <AnimatedScrollView
      className="interest-chips"
      contentContainerClassName="interest-chips__content"
      style={
        footer
          ? { flexShrink: 1 }
          : { maxHeight: height * MAX_HEIGHT_RATIO + BOTTOM_OVERLAP, marginBottom: -BOTTOM_OVERLAP }
      }
      contentContainerStyle={{ paddingBottom: footer ? FOOTER_GAP : BOTTOM_OVERLAP }}
      showsVerticalScrollIndicator={false}
      bounces
      overScrollMode="always"
      decelerationRate="normal"
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      {options.map((interest) => {
        const isSelected = selected.includes(interest);
        const chip = (
          <Pressable
            className={isSelected ? 'interest-chip interest-chip--selected' : 'interest-chip'}
            onPress={() => toggle(interest)}
          >
            <Text className="interest-chip__label">{interest}</Text>
          </Pressable>
        );
        return initialOptions.includes(interest) ? (
          <View key={interest}>{chip}</View>
        ) : (
          <Animated.View key={interest} entering={ZoomIn.duration(250)}>
            {chip}
          </Animated.View>
        );
      })}
      {footer ? <View className="w-full">{footer}</View> : null}
    </AnimatedScrollView>
  );
}
