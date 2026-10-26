import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type EventsState = {
  pinnedIds: string[];
  archivedIds: string[];
  // True after a pin until the user opens the Pinned tab
  hasNewPin: boolean;
  pin: (id: string) => void;
  // Removes the pin and archives the event
  unpin: (id: string) => void;
  clearNewPin: () => void;
  archive: (id: string) => void;
  // Testing only: bring every event back into the feed
  reset: () => void;
};

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      pinnedIds: [],
      archivedIds: [],
      hasNewPin: false,
      pin: (id) =>
        set((state) =>
          state.pinnedIds.includes(id) ? state : { pinnedIds: [...state.pinnedIds, id], hasNewPin: true },
        ),
      clearNewPin: () => set({ hasNewPin: false }),
      // Unpinning archives the event too, so it doesn't come back into the feed
      unpin: (id) =>
        set((state) => ({
          pinnedIds: state.pinnedIds.filter((pinnedId) => pinnedId !== id),
          archivedIds: state.archivedIds.includes(id) ? state.archivedIds : [...state.archivedIds, id],
        })),
      archive: (id) =>
        set((state) =>
          state.archivedIds.includes(id) ? state : { archivedIds: [...state.archivedIds, id] },
        ),
      reset: () => set({ pinnedIds: [], archivedIds: [], hasNewPin: false }),
    }),
    { name: 'events', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
