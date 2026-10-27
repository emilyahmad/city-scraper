import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  /** The signed-in user's first name, or null when signed out */
  firstName: string | null;
  /** True once the user has finished the preferences quiz */
  onboarded: boolean;
  signIn: (firstName: string) => void;
  completeOnboarding: () => void;
  signOut: () => void;
};

// Local stand-in for Clerk: swap signIn/signOut for Clerk's session once it is set up.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      firstName: null,
      onboarded: false,
      signIn: (firstName) => set({ firstName }),
      completeOnboarding: () => set({ onboarded: true }),
      signOut: () => set({ firstName: null, onboarded: false }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Version 0 signed in with an email; keep the user signed in and onboarded, the name comes from their profile
      version: 1,
      migrate: (persisted) => {
        const old = persisted as { email?: string | null; onboarded?: boolean };
        return { firstName: old.email ? 'You' : null, onboarded: old.onboarded ?? false } as AuthState;
      },
    },
  ),
);

/** False until the saved session has been read from AsyncStorage, so the app doesn't flash the sign-in page. */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
}
