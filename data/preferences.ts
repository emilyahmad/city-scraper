import type { PreferenceForm, PreferenceFormId } from '@/types/preferences';

export const PREFERENCE_FORMS: Record<PreferenceFormId, PreferenceForm> = {
  location: {
    title: 'Location & Distance',
    subtitle: 'Where you are and how far you will travel for events.',
    fields: [
      { key: 'location', label: 'Location', placeholder: 'New York, NY' },
      { key: 'distance', label: 'Distance (miles)', placeholder: '5', keyboardType: 'numeric' },
    ],
  },
  availability: {
    title: 'Availability',
    subtitle: 'Which days and times you are free for events.',
    fields: [
      { key: 'days', label: 'Days', placeholder: 'Fri, Sat, Sun' },
      { key: 'times', label: 'Time of day', placeholder: 'Morning, Evening' },
    ],
  },
  interests: {
    title: 'Interests',
    subtitle: 'Tap the topics you want to see events for.',
    fields: [{ key: 'interests', label: 'Interests', placeholder: 'Running, Movies, Finance' }],
  },
};

export const INTEREST_OPTIONS = [
  'Running',
  'Movies',
  'Finance',
  'Music',
  'Art',
  'Food',
  'Comedy',
  'Fitness',
  'Yoga',
  'Tech',
  'Networking',
  'Theater',
  'Books',
  'Gaming',
  'Outdoors',
  'Nightlife',
  'Photography',
  'Dance',
  'Wellness',
  'Fashion',
];
