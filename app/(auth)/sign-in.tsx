import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';

// Share of the screen height above the title, so the hero and form sit in the upper-middle rather than dead center
const HERO_OFFSET = 0.2;

export default function SignInScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const signIn = useAuthStore((state) => state.signIn);
  const setName = useProfileStore((state) => state.setName);
  const [firstName, setFirstName] = useState('');
  const trimmed = firstName.trim();
  const valid = trimmed.length > 0;

  const handleContinue = () => {
    if (!valid) return;
    // Also shown on the Settings profile card
    setName(trimmed);
    signIn(trimmed);
  };

  return (
    <ScrollView
      className="auth-screen"
      contentContainerClassName="auth-screen__content"
      contentContainerStyle={{ paddingTop: top + height * HERO_OFFSET, paddingBottom: bottom + 16 }}
      showsVerticalScrollIndicator={false}
      // Lifts the content above the keyboard, and dragging down hides the keyboard again.
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <View className="auth-screen__hero">
        <Text className="auth-screen__title">Find your next event</Text>
        <Text className="auth-screen__subtitle">
          Enter your name and preferences to receive event recommendations
        </Text>
      </View>
      <TextInput
        className="auth-screen__input"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First name"
        placeholderTextColor="#6b7280"
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />
      <Pressable
        className={valid ? 'auth-screen__button' : 'auth-screen__button auth-screen__button--disabled'}
        disabled={!valid}
        onPress={handleContinue}>
        <Text className="auth-screen__button-label">Continue</Text>
      </Pressable>
    </ScrollView>
  );
}
