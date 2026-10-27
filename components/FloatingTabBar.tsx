import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { BottomTabBarProps } from 'expo-router/tabs';

import { UndoArchiveButton } from '@/components/UndoArchiveButton';
import { GAP_ABOVE_TAB_BAR, TAB_BAR_HEIGHT } from '@/constants/layout';
import { useEventsStore } from '@/store/events';

const ACTIVE_COLOR = '#ffffff';
const INACTIVE_COLOR = '#a1a1aa'; // zinc-400
const BAR_PADDING = 4; // matches p-1 on .floating-tab-bar
// Loose springs so the pill trails the finger and wobbles when it lands
const DRAG_SPRING = { damping: 15, stiffness: 190, mass: 0.9 };
const SETTLE_SPRING = { damping: 11, stiffness: 170, mass: 0.9 };

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const barRef = useRef<ComponentRef<typeof View>>(null);
  const barLeft = useRef(0);
  const [barWidth, setBarWidth] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const barBottom = Math.max(insets.bottom - 6, 6);
  // Tab under the finger while dragging, null when not touching the bar
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const hoverIndex = useRef(state.index);
  const hasNewPin = useEventsStore((store) => store.hasNewPin);
  const clearLastArchive = useEventsStore((store) => store.clearLastArchive);

  // The Undo button belongs to the screen the archive happened on, so switching tabs dismisses it
  useEffect(() => {
    clearLastArchive();
  }, [state.index, clearLastArchive]);

  const tabCount = state.routes.length;
  const itemWidth = Math.max((barWidth - BAR_PADDING * 2) / tabCount, 0);
  const activeIndex = dragIndex ?? state.index;

  // Position of the grey pill, relative to the first tab
  const indicatorX = useSharedValue(0);
  // Where the pill is heading; the gap between this and indicatorX drives the liquid stretch
  const targetX = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => {
    const lag = targetX.get() - indicatorX.get();
    const travel = Math.abs(lag) / Math.max(itemWidth, 1);
    const stretch = interpolate(travel, [0, 1.5], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [
        // Lean the leading edge toward the target while stretched
        { translateX: indicatorX.get() + Math.sign(lag) * stretch * itemWidth * 0.12 },
        { scaleX: 1 + stretch * 0.5 },
        { scaleY: 1 - stretch * 0.18 },
      ],
    };
  });

  const moveTo = (x: number, spring: typeof DRAG_SPRING) => {
    targetX.set(x);
    indicatorX.set(withSpring(x, spring));
  };

  // Slide to the selected tab whenever it changes (taps, back navigation, finger release)
  useEffect(() => {
    moveTo(state.index * itemWidth, SETTLE_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, itemWidth]);

  const measureBar = () => {
    barRef.current?.measureInWindow((x: number) => {
      barLeft.current = x;
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
    setBarHeight(event.nativeEvent.layout.height);
    measureBar();
  };

  // Where the pill should sit so it is centered under the finger, kept inside the bar
  const pillXForFinger = (pageX: number) => {
    const x = pageX - barLeft.current - BAR_PADDING - itemWidth / 2;
    return Math.min(Math.max(x, 0), (tabCount - 1) * itemWidth);
  };

  const handleTouchStart = (pageX: number) => {
    measureBar();
    const x = pillXForFinger(pageX);
    hoverIndex.current = Math.round(x / itemWidth);
    setDragIndex(hoverIndex.current);
    moveTo(x, DRAG_SPRING);
  };

  const handleTouchMove = (pageX: number) => {
    const x = pillXForFinger(pageX);
    hoverIndex.current = Math.round(x / itemWidth);
    setDragIndex(hoverIndex.current);
    moveTo(x, DRAG_SPRING); // chases the finger with a little lag
  };

  const handleTouchEnd = () => {
    const index = hoverIndex.current;
    const route = state.routes[index];
    setDragIndex(null);
    moveTo(index * itemWidth, SETTLE_SPRING);

    if (index === state.index) return;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigateToTab(route.key);
    }
  };

  return (
    <>
      {/* Fills the space between the bar's top and the Explore card stack's bottom */}
      <UndoArchiveButton bottom={barBottom + barHeight} height={TAB_BAR_HEIGHT + GAP_ABOVE_TAB_BAR - barHeight} />
      <View
        ref={barRef}
        className={
          state.routes[state.index].name === 'index'
            ? 'floating-tab-bar floating-tab-bar--translucent'
            : 'floating-tab-bar'
        }
        style={{ bottom: barBottom }}
        onLayout={handleLayout}
        onTouchStart={(event) => handleTouchStart(event.nativeEvent.pageX)}
        onTouchMove={(event) => handleTouchMove(event.nativeEvent.pageX)}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}>
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: BAR_PADDING, bottom: BAR_PADDING, left: BAR_PADDING, width: itemWidth }, indicatorStyle]}>
          <View className="floating-tab-bar__indicator" />
        </Animated.View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = activeIndex === index;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <View
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: state.index === index }}
              className="floating-tab-bar__item">
              <View>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {route.name === 'pinned' && hasNewPin && <View className="floating-tab-bar__badge" />}
              </View>
              <Text className={focused ? 'floating-tab-bar__label floating-tab-bar__label--active' : 'floating-tab-bar__label'}>
                {options.title}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}
