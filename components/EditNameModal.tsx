import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { EditableField } from "@/components/EditableField";
import { images } from "@/constants/images";
import { usePressScale } from "@/hooks/usePressScale";
import { useProfileStore } from "@/store/profile";

type EditNameModalProps = {
  visible: boolean;
  onClose: () => void;
};

const ANIMATION_MS = 350;
const CLOSE_MS = 280;
const SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

const NAME_FIELD = { label: "Name", placeholder: "Your name" };

// Slides up like the preferences sheet, with the backdrop fading separately.
export function EditNameModal({ visible, onClose }: EditNameModalProps) {
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  // Keep the modal mounted while it slides out; it unmounts once the close animation finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      dragY.value = 0;
      progress.value = withTiming(1, {
        duration: ANIMATION_MS,
        easing: SHEET_EASING,
      });
    } else {
      progress.value = withTiming(
        0,
        { duration: CLOSE_MS, easing: SHEET_EASING },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
    }
  }, [visible, progress, dragY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(dragY.value / height, 1)),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + dragY.value }],
  }));

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Dragging down moves the sheet with the finger; letting go past the threshold (or flicking) closes it.
  const swipeDown = usePanGesture({
    activeOffsetY: 10,
    failOffsetX: [-20, 20],
    onUpdate: (event) => {
      "worklet";
      dragY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      "worklet";
      if (
        event.translationY > DISMISS_DISTANCE ||
        event.velocityY > DISMISS_VELOCITY
      ) {
        scheduleOnRN(close);
      } else {
        dragY.set(withTiming(0, { duration: 200 }));
      }
    },
  });

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={close}
    >
      <GestureHandlerRootView className="flex-1">
        <Animated.View
          style={[
            { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
            backdropStyle,
          ]}
        >
          <Pressable className="edit-modal__backdrop" onPress={close} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
          className="edit-modal"
        >
          <GestureDetector gesture={swipeDown}>
            <Animated.View style={sheetStyle}>
              <EditNameSheet onClose={close} />
              <View className="edit-modal__fill" pointerEvents="none" />
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Mounted fresh each time the modal opens, so the draft always starts from the saved name.
function EditNameSheet({ onClose }: { onClose: () => void }) {
  const saved = useProfileStore((state) => state.name);
  const setName = useProfileStore((state) => state.setName);
  const [draft, setDraft] = useState(saved);
  const { scaleStyle, pressHandlers } = usePressScale();

  const trimmed = draft.trim();
  const empty = !trimmed;
  const showSave = empty || trimmed !== saved;

  const handleSave = () => {
    if (empty) return;
    setName(trimmed);
    onClose();
  };

  return (
    <View className="edit-modal__sheet">
      <View className="edit-modal__heading">
        <Text className="edit-modal__title">Edit Profile</Text>
      </View>
      <Text className="edit-modal__subtitle">
        Change the name shown on your profile
      </Text>
      <Pressable className="edit-modal__close" onPress={onClose} hitSlop={16}>
        <Image
          source={images.close}
          tintColor="#ffffff"
          contentFit="contain"
          style={{ width: 14, height: 14 }}
        />
      </Pressable>
      <View className="settings-section__card mt-6">
        <EditableField
          field={NAME_FIELD}
          value={draft}
          isLast
          onChange={setDraft}
        />
      </View>
      <Animated.View
        style={scaleStyle}
        pointerEvents={showSave ? "auto" : "none"}
      >
        <Pressable
          className={
            empty
              ? "edit-modal__save edit-modal__save--disabled"
              : "edit-modal__save"
          }
          style={{ opacity: showSave ? 1 : 0 }}
          disabled={empty}
          onPress={handleSave}
          {...pressHandlers}
        >
          <Text className="edit-modal__save-label">
            {empty ? "Enter a name" : "Save Changes"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
