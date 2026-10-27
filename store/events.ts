import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EventItem } from '@/types/events';

type LastArchive = {
  event: EventItem;
  // Archived from the Pinned page, so undoing pins it again
  wasPinned: boolean;
};

type EventsState = {
  // Whole events, not ids, because the scraped feed changes and a pinned event may no longer be in it
  pinnedEvents: EventItem[];
  archivedIds: string[];
  // True after a pin until the user opens the Pinned tab
  hasNewPin: boolean;
  // Most recent archive that can still be undone; not persisted
  lastArchive: LastArchive | null;
  pin: (event: EventItem) => void;
  // Removes the pin and archives the event
  unpin: (id: string) => void;
  clearNewPin: () => void;
  archive: (event: EventItem) => void;
  undoArchive: () => void;
  clearLastArchive: () => void;
  // Testing only: bring every event back into the feed
  reset: () => void;
};

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      pinnedEvents: [],
      archivedIds: [],
      hasNewPin: false,
      lastArchive: null,
      pin: (event) =>
        set((state) =>
          state.pinnedEvents.some((pinned) => pinned.id === event.id)
            ? state
            : { pinnedEvents: [...state.pinnedEvents, event], hasNewPin: true },
        ),
      clearNewPin: () => set({ hasNewPin: false }),
      // Unpinning archives the event too, so it doesn't come back into the feed
      unpin: (id) =>
        set((state) => {
          const event = state.pinnedEvents.find((pinned) => pinned.id === id);
          if (!event) return state;
          return {
            pinnedEvents: state.pinnedEvents.filter((pinned) => pinned.id !== id),
            archivedIds: state.archivedIds.includes(id) ? state.archivedIds : [...state.archivedIds, id],
            lastArchive: { event, wasPinned: true },
          };
        }),
      archive: (event) =>
        set((state) =>
          state.archivedIds.includes(event.id)
            ? state
            : { archivedIds: [...state.archivedIds, event.id], lastArchive: { event, wasPinned: false } },
        ),
      undoArchive: () =>
        set((state) => {
          const last = state.lastArchive;
          if (!last) return state;
          const alreadyPinned = state.pinnedEvents.some((pinned) => pinned.id === last.event.id);
          return {
            archivedIds: state.archivedIds.filter((archivedId) => archivedId !== last.event.id),
            pinnedEvents: last.wasPinned && !alreadyPinned ? [...state.pinnedEvents, last.event] : state.pinnedEvents,
            lastArchive: null,
          };
        }),
      clearLastArchive: () => set({ lastArchive: null }),
      reset: () => set({ pinnedEvents: [], archivedIds: [], hasNewPin: false, lastArchive: null }),
    }),
    {
      name: 'events',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ pinnedEvents, archivedIds, hasNewPin }) => ({ pinnedEvents, archivedIds, hasNewPin }),
      // Version 0 stored ids of the old sample events, which no longer exist
      version: 1,
      migrate: () => ({ pinnedEvents: [], archivedIds: [], hasNewPin: false }),
    },
  ),
);
