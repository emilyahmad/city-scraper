import { useEffect, useState } from 'react';

import { usePreferencesStore } from '@/store/preferences';
import type { EventItem } from '@/types/events';

type EventsResult = {
  events: EventItem[];
  loading: boolean;
  error: string | null;
};

type EventsResponse = { events: EventItem[] } | { error: string };

// Fetches the ranked feed from /api/events for the saved preferences, and again whenever they change.
// Relative URLs work on native too: Expo points them at the dev server (or the `origin` set in app.json in production).
export function useEvents() {
  const values = usePreferencesStore((state) => state.values);
  // Wait for saved preferences to load, so the first request isn't made with the defaults
  const [hydrated, setHydrated] = useState(() => usePreferencesStore.persist.hasHydrated());
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<EventsResult>({ events: [], loading: true, error: null });
  const query = new URLSearchParams(values).toString();

  useEffect(() => usePreferencesStore.persist.onFinishHydration(() => setHydrated(true)), []);

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setResult((previous) => ({ ...previous, loading: true, error: null }));

    fetch(`/api/events?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data: EventsResponse = await response.json();
        if ('error' in data) throw new Error(data.error);
        setResult({ events: data.events, loading: false, error: null });
      })
      .catch((error: unknown) => {
        // A newer request replaced this one
        if (controller.signal.aborted) return;
        setResult({ events: [], loading: false, error: error instanceof Error ? error.message : 'Something went wrong' });
      });

    return () => controller.abort();
  }, [hydrated, query, reloadCount]);

  return { ...result, refresh: () => setReloadCount((count) => count + 1) };
}
