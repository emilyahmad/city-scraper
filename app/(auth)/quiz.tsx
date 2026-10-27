import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InterestChips } from '@/components/InterestChips';
import { QuizAvailabilityStep } from '@/components/QuizAvailabilityStep';
import { QuizLocationStep } from '@/components/QuizLocationStep';
import { QuizProgress } from '@/components/QuizProgress';
import { ScreenHeader } from '@/components/ScreenHeader';
import { QUIZ_STEPS } from '@/data/quiz';
import { hasEmptySlotDays } from '@/lib/times';
import { useAuthStore } from '@/store/auth';
import { usePreferencesStore } from '@/store/preferences';
import type { PreferenceValues } from '@/types/preferences';

// Starts blank so nothing is pre-selected, except a sensible distance and evening hours.
const INITIAL_ANSWERS: PreferenceValues = {
  location: '',
  distance: '5',
  days: '',
  times: '6:00 PM - 10:00 PM',
  interests: '',
};

export default function QuizScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const setValues = usePreferencesStore((state) => state.setValues);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<PreferenceValues>(INITIAL_ANSWERS);
  const interestsScroll = useSharedValue(0);

  const step = QUIZ_STEPS[stepIndex];
  const isLast = stepIndex === QUIZ_STEPS.length - 1;
  const update = (values: Partial<PreferenceValues>) => setAnswers((current) => ({ ...current, ...values }));

  // Same rules as the settings sheets: a city, at least one day, and at least one interest.
  const blocker = {
    location: answers.location ? null : 'Select a suggested city',
    availability: answers.days.trim() && !hasEmptySlotDays(answers.times) ? null : 'Select a day',
    interests: answers.interests.trim() ? null : 'Select an interest',
  }[step.id];

  const next = () => {
    if (!isLast) return setStepIndex(stepIndex + 1);
    setValues(answers);
    completeOnboarding();
  };

  const button = (
    <Pressable
      className={blocker ? 'quiz-screen__button quiz-screen__button--disabled' : 'quiz-screen__button'}
      disabled={blocker !== null}
      onPress={next}>
      <Text className="quiz-screen__button-label">{blocker ?? (isLast ? 'Finish' : 'Continue')}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="quiz-screen"
      style={{ paddingTop: top + 12, paddingBottom: bottom + 16 }}>
      <QuizProgress steps={QUIZ_STEPS.length} current={stepIndex} />
      <View className="quiz-screen__top">
        <Pressable
          className={stepIndex === 0 ? 'quiz-screen__back quiz-screen__back--hidden' : 'quiz-screen__back'}
          disabled={stepIndex === 0}
          hitSlop={12}
          onPress={() => setStepIndex(stepIndex - 1)}>
          <Text className="quiz-screen__back-label">Back</Text>
        </Pressable>
        <Text className="quiz-screen__count">
          {stepIndex + 1} of {QUIZ_STEPS.length}
        </Text>
      </View>
      <View className="mt-4">
        <ScreenHeader title={step.title} subtitle={step.subtitle} />
      </View>
      {/* Keyed by step so each page starts fresh (scroll position, open pickers). */}
      <View key={step.id} className="quiz-screen__body">
        {step.id === 'location' ? (
          <QuizLocationStep location={answers.location} distance={answers.distance} onChange={update} />
        ) : step.id === 'availability' ? (
          <QuizAvailabilityStep days={answers.days} times={answers.times} onChange={update} />
        ) : (
          <InterestChips value={answers.interests} scrollOffset={interestsScroll} onChange={(interests) => update({ interests })} footer={button} />
        )}
      </View>
      {isLast ? null : button}
    </KeyboardAvoidingView>
  );
}
