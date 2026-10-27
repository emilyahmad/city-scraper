import type { PreferenceFormId } from '@/types/preferences';

export type QuizStep = {
  id: PreferenceFormId;
  title: string;
  subtitle: string;
};

export const QUIZ_STEPS: QuizStep[] = [
  { id: 'location', title: 'Where are you based?', subtitle: 'Pick your city and how far you would travel for an event' },
  { id: 'availability', title: 'When are you free?', subtitle: 'Choose the days and times that work for you' },
  { id: 'interests', title: 'What are you into?', subtitle: 'Tap the topics you want to see events for. More will appear as you go' },
];
