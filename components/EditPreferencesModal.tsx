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
import { InterestChips } from "@/components/InterestChips";
import { images } from "@/constants/images";
import { PREFERENCE_FORMS } from "@/data/preferences";
import { usePreferencesStore } from "@/store/preferences";
import type { PreferenceFormId, PreferenceValues } from "@/types/preferences";

type EditPreferencesModalProps = {
  visible: boolean;
  formId: PreferenceFormId;
  onClose: () => void;
};

const ANIMATION_MS = 350;
const CLOSE_MS = 280;
const SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

// The backdrop fades while the sheet slides, so they use separate animations instead of Modal's built-in slide.
export function EditPreferencesModal({
  visible,
  formId,
  onClose,
}: EditPreferencesModalProps) {
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  // Hide the keyboard together with the sheet so it doesn't linger or snap away mid-slide.
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

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
              <EditPreferencesSheet formId={formId} onClose={close} />
              {/* Extends the sheet color behind the keyboard so its rounded corners don't reveal the backdrop. */}
              <View className="edit-modal__fill" pointerEvents="none" />
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Mounted fresh each time the modal opens, so the draft always starts from the saved values.
function EditPreferencesSheet({
  formId,
  onClose,
}: Pick<EditPreferencesModalProps, "formId" | "onClose">) {
  const form = PREFERENCE_FORMS[formId];
  const saved = usePreferencesStore((state) => state.values);
  const setValues = usePreferencesStore((state) => state.setValues);
  const [draft, setDraft] = useState<PreferenceValues>(saved);

  const hasChanges = form.fields.some(
    (field) => draft[field.key] !== saved[field.key],
  );

  const handleSave = () => {
    setValues(draft);
    onClose();
  };

  return (
    <View className="edit-modal__sheet">
      <Text className="edit-modal__title">{form.title}</Text>
      <Text className="edit-modal__subtitle">{form.subtitle}</Text>
      <Pressable className="edit-modal__close" onPress={onClose} hitSlop={16}>
        <Image
          source={images.close}
          tintColor="#ffffff"
          contentFit="contain"
          style={{ width: 14, height: 14 }}
        />
      </Pressable>
      {formId === "interests" ? (
        <InterestChips
          value={draft.interests}
          onChange={(interests) =>
            setDraft((current) => ({ ...current, interests }))
          }
        />
      ) : (
        <View className="settings-section__card mt-6">
          {form.fields.map((field, index) => (
            <EditableField
              key={field.key}
              field={field}
              value={draft[field.key]}
              isLast={index === form.fields.length - 1}
              onChange={(value) =>
                setDraft((current) => ({ ...current, [field.key]: value }))
              }
            />
          ))}
        </View>
      )}
      {hasChanges ? (
        <Pressable className="edit-modal__save" onPress={handleSave}>
          <Text className="edit-modal__save-label">Save Changes</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
