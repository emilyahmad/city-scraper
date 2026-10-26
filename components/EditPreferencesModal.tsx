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
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { DayPicker } from "@/components/DayPicker";
import { CitySuggestions } from "@/components/CitySuggestions";
import { EditableField } from "@/components/EditableField";
import { InterestChips } from "@/components/InterestChips";
import { TimeRangePicker } from "@/components/TimeRangePicker";
import { images } from "@/constants/images";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { usePressScale } from "@/hooks/usePressScale";
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
// Where the expanded sheet's top edge sits, as a share of the screen height.
const SHEET_TOP_RATIO = 0.16;

// The backdrop fades while the sheet slides, so they use separate animations instead of Modal's built-in slide.
export function EditPreferencesModal({
  visible,
  formId,
  onClose,
}: EditPreferencesModalProps) {
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const startedAtTop = useSharedValue(true);
  const [mounted, setMounted] = useState(visible);
  const [closeBlocked, setCloseBlocked] = useState(false);
  // Bumped each time a close is refused, so the sheet can draw attention to its save button.
  const [nudge, setNudge] = useState(0);
  const keyboardHeight = useKeyboardHeight();
  const keyboardVisible = keyboardHeight > 0;
  // While typing a location the sheet grows to fill the space above the keyboard, leaving a strip of the screen behind it.
  const expanded = formId === "location" && keyboardVisible;

  // Hide the keyboard together with the sheet so it doesn't linger or snap away mid-slide.
  const close = () => {
    Keyboard.dismiss();
    // An empty location can't be saved, so closing is refused and the button flags it instead.
    if (closeBlocked) {
      setNudge((count) => count + 1);
      dragY.set(withTiming(0, { duration: 200 }));
      return;
    }
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
    // While the keyboard is up, a downward drag on the list closes the keyboard instead of the sheet.
    enabled: !expanded,
    activeOffsetY: 10,
    onBegin: () => {
      "worklet";
      // A drag that starts while the interest grid is scrolled belongs to the grid, not the sheet.
      startedAtTop.set(scrollOffset.value <= 0);
    },
    failOffsetX: [-20, 20],
    onUpdate: (event) => {
      "worklet";
      if (!startedAtTop.value) return;
      dragY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      "worklet";
      if (!startedAtTop.value) return;
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
            <Animated.View
              style={[
                sheetStyle,
                // Never taller than the space above the keyboard, so the top of the sheet can't slide off screen.
                { maxHeight: height * (1 - SHEET_TOP_RATIO) - keyboardHeight },
                expanded ? { flex: 1, marginTop: height * SHEET_TOP_RATIO } : null,
              ]}
            >
              <EditPreferencesSheet
                formId={formId}
                expanded={expanded}
                scrollOffset={scrollOffset}
                onClose={close}
                onCloseBlockedChange={setCloseBlocked}
                nudge={nudge}
              />
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
  expanded,
  scrollOffset,
  onClose,
  onCloseBlockedChange,
  nudge,
}: Pick<EditPreferencesModalProps, "formId" | "onClose"> & {
  onCloseBlockedChange: (blocked: boolean) => void;
  nudge: number;
  expanded: boolean;
  scrollOffset: SharedValue<number>;
}) {
  const form = PREFERENCE_FORMS[formId];
  const saved = usePreferencesStore((state) => state.values);
  const setValues = usePreferencesStore((state) => state.setValues);
  const [draft, setDraft] = useState<PreferenceValues>(saved);
  // What the user has typed into the location field. Picking a suggestion changes the draft but not this, so the list stays put.
  const [locationQuery, setLocationQuery] = useState<string | null>(null);
  // The suggestion the user last tapped.
  const [pickedLocation, setPickedLocation] = useState<string | null>(null);
  const showCitySuggestions = formId === "location" && locationQuery !== null;
  // Days and times are edited with their own pickers instead of text fields.
  const fields = form.fields.filter(
    (field) => field.key !== "days" && field.key !== "times",
  );

  const hasChanges = form.fields.some(
    (field) => draft[field.key] !== saved[field.key],
  );

  // The interests form can't be saved empty.
  const needsInterests = formId === "interests" && !draft.interests.trim();
  // The location can't be saved empty either, and the sheet can't be closed while it is.
  const needsLocation = formId === "location" && !draft.location.trim();
  // Only the saved city or one tapped in the suggestions counts; free-typed text doesn't.
  const locationInvalid =
    formId === "location" &&
    !(
      draft.location.trim() &&
      (draft.location === saved.location || draft.location === pickedLocation)
    );
  const saveDisabled = needsInterests || locationInvalid;
  // Closing discards the draft, so it is refused when that would leave no valid location behind.
  const closeBlocked =
    locationInvalid && (needsLocation || !saved.location.trim());
  useEffect(() => {
    onCloseBlockedChange(closeBlocked);
  }, [closeBlocked, onCloseBlockedChange]);

  const nudgeX = useSharedValue(0);
  useEffect(() => {
    if (nudge === 0) return;
    nudgeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 100 }),
      withTiming(-8, { duration: 100 }),
      withTiming(0, { duration: 50 }),
    );
  }, [nudge, nudgeX]);
  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudgeX.value }],
  }));

  // A missing required value also shows the button, even when nothing changed (e.g. the saved location is already empty).
  // Tapping a suggestion also shows it, even if that is the city already saved, so the choice can be confirmed.
  const showSave =
    hasChanges || saveDisabled || draft.location === pickedLocation;
  const saveOpacity = useSharedValue(0);
  useEffect(() => {
    saveOpacity.value = withTiming(showSave ? 1 : 0, { duration: 200 });
  }, [showSave, saveOpacity]);
  const saveStyle = useAnimatedStyle(() => ({ opacity: saveOpacity.value }));
  const { scaleStyle: saveScale, pressHandlers: savePress } = usePressScale();

  const handleSave = () => {
    setValues(draft);
    if (formId !== "location") {
      onClose();
      return;
    }
    // The location sheet stays open and returns to how it looked on opening: no suggestions, no keyboard, no save button.
    Keyboard.dismiss();
    setLocationQuery(null);
    setPickedLocation(null);
  };

  const saveButton = (
      <Animated.View
        style={[saveStyle, saveScale, nudgeStyle]}
        pointerEvents={showSave ? "auto" : "none"}
      >
        <Pressable
          className={
            saveDisabled
              ? "edit-modal__save edit-modal__save--disabled"
              : "edit-modal__save"
          }
          disabled={saveDisabled}
          onPress={handleSave}
          {...savePress}
        >
          <Text className="edit-modal__save-label">
            {needsInterests
              ? "No interests selected"
              : needsLocation
                ? "No location selected"
                : locationInvalid
                  ? "Select a suggested city"
                  : "Save Changes"}
          </Text>
        </Pressable>
      </Animated.View>
  );

  return (
    <View
      className="edit-modal__sheet"
      // The suggestions list supplies its own bottom padding, so it scrolls all the way to the sheet's edge (or the keyboard) with nothing covering it.
      style={[
        expanded ? { flex: 1 } : { flexShrink: 1 },
        (expanded || showCitySuggestions) && { paddingBottom: 0 },
      ]}
    >
      <View className="edit-modal__heading">
        <Text className="edit-modal__title">{form.title}</Text>
      </View>
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
          scrollOffset={scrollOffset}
          onChange={(interests) =>
            setDraft((current) => ({ ...current, interests }))
          }
        />
      ) : (
        <>
          {formId === "availability" ? (
            <>
              <DayPicker
                value={draft.days}
                onChange={(days) =>
                  setDraft((current) => ({ ...current, days }))
                }
              />
              <TimeRangePicker
                value={draft.times}
                scrollOffset={scrollOffset}
                onChange={(times) =>
                  setDraft((current) => ({ ...current, times }))
                }
              />
            </>
          ) : null}
          {fields.length ? (
          <View className="settings-section__card mt-6">
            {fields.map((field, index) => (
              <EditableField
                key={field.key}
                field={field}
                value={draft[field.key]}
                isLast={index === fields.length - 1}
                onChange={(value) => {
                  if (field.key === "location") setLocationQuery(value);
                  setDraft((current) => ({ ...current, [field.key]: value }));
                }}
              />
            ))}
          </View>
          ) : null}
        </>
      )}
      {showCitySuggestions ? (
        <CitySuggestions
          query={locationQuery ?? ""}
          selected={draft.location}
          scrollOffset={scrollOffset}
          fill={expanded}
          onSelect={(location) => {
            // Close the keyboard so the save button comes into view.
            Keyboard.dismiss();
            setPickedLocation(location);
            setDraft((current) => ({ ...current, location }));
          }}
        >
          {saveButton}
        </CitySuggestions>
      ) : (
        saveButton
      )}
    </View>
  );
}
