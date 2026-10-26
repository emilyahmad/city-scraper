import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type SwipeBackdropProps = {
  // -1 (fully swiped to archive) to 1 (fully swiped to pin); 0 when idle
  progress: SharedValue<number>;
};

const PIN_COLORS = ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.6)'] as const;
const ARCHIVE_COLORS = ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.6)'] as const;

// Colour wash over the map that grows from the bottom edge while a card is dragged.
export function SwipeBackdrop({ progress }: SwipeBackdropProps) {
  const pinStyle = useAnimatedStyle(() => ({ opacity: Math.max(progress.get(), 0) }));
  const archiveStyle = useAnimatedStyle(() => ({ opacity: Math.max(-progress.get(), 0) }));

  return (
    <>
      <Animated.View pointerEvents="none" className="swipe-backdrop" style={pinStyle}>
        <LinearGradient colors={PIN_COLORS} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View pointerEvents="none" className="swipe-backdrop" style={archiveStyle}>
        <LinearGradient colors={ARCHIVE_COLORS} style={{ flex: 1 }} />
      </Animated.View>
    </>
  );
}
