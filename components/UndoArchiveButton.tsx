import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useEventsStore } from '@/store/events';

const VISIBLE_MS = 4000;

type UndoArchiveButtonProps = {
  // Distance from the bottom of the screen, so it sits just above the tab bar
  bottom: number;
  // Height of the space it's centred in
  height: number;
};

// Shown for a few seconds after an event is archived, from either the Explore or the Pinned page.
export function UndoArchiveButton({ bottom, height }: UndoArchiveButtonProps) {
  const lastArchive = useEventsStore((state) => state.lastArchive);
  const undoArchive = useEventsStore((state) => state.undoArchive);
  const clearLastArchive = useEventsStore((state) => state.clearLastArchive);

  // Each archive sets a new object, so archiving again restarts the timer
  useEffect(() => {
    if (!lastArchive) return;
    const timer = setTimeout(clearLastArchive, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastArchive, clearLastArchive]);

  if (!lastArchive) return null;

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} className="undo-archive" style={{ bottom, height }} pointerEvents="box-none">
      <Pressable className="undo-archive__button" onPress={undoArchive} hitSlop={8}>
        <Text className="undo-archive__label">Undo</Text>
      </Pressable>
    </Animated.View>
  );
}
