import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type EventsState = {
  pinnedIds: string[];
  archivedIds: string[];
  pin: (id: string) => void;
  unpin: (id: string) => void;
  archive: (id: string) => void;
  // Testing only: bring every event back into the feed
  reset: () => void;
};

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      pinnedIds: [],
      archivedIds: [],
      pin: (id) =>
        set((state) => (state.pinnedIds.includes(id) ? state : { pinnedIds: [...state.pinnedIds, id] })),
      unpin: (id) => set((state) => ({ pinnedIds: state.pinnedIds.filter((pinnedId) => pinnedId !== id) })),
      archive: (id) =>
        set((state) =>
          state.archivedIds.includes(id) ? state : { archivedIds: [...state.archivedIds, id] },
        ),
      reset: () => set({ pinnedIds: [], archivedIds: [] }),
    }),
    { name: 'events', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
