import { type ReactNode, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, type SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { type CitySuggestion, searchCities } from '@/lib/cities';

// Wrapped from RN's ScrollView (not Animated.ScrollView) so className keeps working under NativeWind.
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type CitySuggestionsProps = {
  query: string;
  /** Label of the currently chosen city, which gets highlighted when it is in the list */
  selected: string;
  onSelect: (label: string) => void;
  /** Mirrors the list's scroll position so the sheet's swipe-to-close can tell when it is scrolled */
  scrollOffset: SharedValue<number>;
  /** Takes all the space the sheet has left (while editing) instead of sizing to its content */
  fill: boolean;
  /** Scrolls below the suggestions, e.g. the save button */
  children?: ReactNode;
};

const DEBOUNCE_MS = 120;
const MIN_QUERY_LENGTH = 1;

export function CitySuggestions({ query, selected, onSelect, scrollOffset, fill, children }: CitySuggestionsProps) {
  // Tracked on the UI thread so scrolling never waits on the JS thread.
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollOffset.set(event.contentOffset.y);
  });
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchCities(trimmed, controller.signal)
        .then(setSuggestions)
        .catch(() => {
          // Offline or aborted: keep whatever is already shown.
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const hasSuggestions = trimmed.length >= MIN_QUERY_LENGTH && suggestions.length > 0;

  return (
    <AnimatedScrollView
      style={fill ? { flex: 1 } : { flexShrink: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      // Stops at the end of the content instead of springing past the save button.
      bounces={false}
      overScrollMode="never"
      keyboardShouldPersistTaps="handled"
      // Dragging the list down pulls the keyboard away with the finger on iOS; Android closes it as soon as the drag starts.
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      {hasSuggestions && (
        <Animated.View entering={FadeIn.duration(150)} className="city-suggestions">
          {suggestions.map((city, index) => {
            const isSelected = city.label === selected;
            // A row's own line takes the highlight color, and the line touching the top of a highlighted row blends into the card.
            const dividerHidden = suggestions[index + 1]?.label === selected;
            const bodyClass = [
              'city-suggestion__body',
              index < suggestions.length - 1 && 'city-suggestion__body--divider',
              index < suggestions.length - 1 && isSelected && 'city-suggestion__body--divider-selected',
              dividerHidden && 'city-suggestion__body--divider-hidden',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <Pressable
                key={city.id}
                className={isSelected ? 'city-suggestion city-suggestion--selected' : 'city-suggestion'}
                onPress={() => onSelect(city.label)}
              >
                <View className={bodyClass}>
                  <Text className="city-suggestion__name" numberOfLines={1}>
                    {city.label}
                  </Text>
                  <Text
                    className={isSelected ? 'city-suggestion__detail city-suggestion__detail--selected' : 'city-suggestion__detail'}
                    numberOfLines={1}
                  >
                    {city.detail}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
      {children}
    </AnimatedScrollView>
  );
}
