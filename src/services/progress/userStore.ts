import { useSyncExternalStore } from "react";

import type { UserState } from "@/domain/models";
import {
  createUserStateRepository,
  type LoadOutcome,
  type UserStateRepository,
} from "@/services/storage/userStateRepository";
import { createDefaultUserState } from "@/services/storage/userStateSchema";

type Listener = () => void;

/**
 * Uygulama genelindeki kullanıcı durumu. Değişiklikler saf güncelleme
 * fonksiyonlarıyla yapılır (domain/progress) ve otomatik olarak kaydedilir.
 */
export function createUserStore(repository: UserStateRepository) {
  let state: UserState = createDefaultUserState();
  let hydrated = false;
  let lastLoadOutcome: LoadOutcome | null = null;
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((l) => l());

  return {
    getState: () => state,
    isHydrated: () => hydrated,
    getLastLoadOutcome: () => lastLoadOutcome,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async hydrate() {
      const res = await repository.load();
      state = res.state;
      lastLoadOutcome = res.outcome;
      hydrated = true;
      emit();
      return res.outcome;
    },
    /** Durumu günceller ve kaydı planlar. Değişiklik yoksa hiçbir şey yapmaz. */
    update(updater: (s: UserState) => UserState) {
      const next = updater(state);
      if (next === state) return;
      state = next;
      repository.save(state);
      emit();
    },
    flush: () => repository.flush(),
    async reset() {
      state = await repository.reset();
      emit();
    },
  };
}

export type UserStore = ReturnType<typeof createUserStore>;

export const userStore = createUserStore(createUserStateRepository());

export function useUserState(): UserState {
  return useSyncExternalStore(userStore.subscribe, userStore.getState, userStore.getState);
}
