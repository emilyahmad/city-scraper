import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PreferenceValues } from '@/types/preferences';

type PreferencesState = {
  values: PreferenceValues;
  setValues: (values: Partial<PreferenceValues>) => void;
};

const DEFAULT_VALUES: PreferenceValues = {
  location: 'New York, NY',
  distance: '5',
  days: 'Fri, Sat, Sun',
  times: '6:00 PM - 10:00 PM',
  interests: 'Running, Movies, Finance',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      values: DEFAULT_VALUES,
      setValues: (values) => set((state) => ({ values: { ...state.values, ...values } })),
    }),
    { name: 'preferences', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
