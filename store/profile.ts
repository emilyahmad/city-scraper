import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProfileState = {
  name: string;
  setName: (name: string) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: 'Your Name',
      setName: (name) => set({ name }),
    }),
    { name: 'profile', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
