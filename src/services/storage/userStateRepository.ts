import type { UserState } from "@/domain/models";

import { asyncStorageStore, type KeyValueStore } from "./keyValueStore";
import { migrate, migrations as defaultMigrations, type Migration } from "./migrations";
import { CURRENT_USER_SCHEMA_VERSION, createDefaultUserState, sanitizeUserState } from "./userStateSchema";

export const USER_STATE_KEY = "grammarpath/user-state";
const BACKUP_PREFIX = "grammarpath/user-state-backup/";

export type LoadOutcome =
  | "empty" // ilk açılış
  | "loaded"
  | "repaired" // bazı geçersiz kayıtlar atıldı
  | "migrated"
  | "recovered"; // okunamadı; yedeklendi ve varsayılan durum kullanıldı

export type LoadResult = { state: UserState; outcome: LoadOutcome };

type Options = {
  store?: KeyValueStore;
  /** Yazmaları birleştirme gecikmesi (ms). */
  debounceMs?: number;
  now?: () => number;
  migrations?: Record<number, Migration>;
  onError?: (error: unknown) => void;
};

/**
 * Kullanıcı verisinin tek giriş noktası. Ekranlar bu katmanı doğrudan değil,
 * userStore üzerinden kullanır.
 */
export function createUserStateRepository(options: Options = {}) {
  const store = options.store ?? asyncStorageStore;
  const debounceMs = options.debounceMs ?? 400;
  const now = options.now ?? Date.now;
  const steps = options.migrations ?? defaultMigrations;
  const onError = options.onError ?? ((e: unknown) => console.warn("[storage]", e));

  let pending: UserState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let writing: Promise<void> = Promise.resolve();
  /** Kayıt daha yeni bir uygulama sürümüne aitse üzerine yazılmaz. */
  let readOnly = false;

  async function backup(raw: string) {
    try {
      await store.setItem(`${BACKUP_PREFIX}${now()}`, raw);
    } catch (e) {
      onError(e);
    }
  }

  async function load(): Promise<LoadResult> {
    readOnly = false;
    let raw: string | null;
    try {
      raw = await store.getItem(USER_STATE_KEY);
    } catch (e) {
      onError(e);
      return { state: createDefaultUserState(), outcome: "recovered" };
    }
    if (raw === null) return { state: createDefaultUserState(), outcome: "empty" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      onError(e);
      await backup(raw);
      return { state: createDefaultUserState(), outcome: "recovered" };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      await backup(raw);
      return { state: createDefaultUserState(), outcome: "recovered" };
    }

    let obj = parsed as Record<string, unknown>;
    const version = typeof obj.schemaVersion === "number" ? obj.schemaVersion : 0;
    if (version > CURRENT_USER_SCHEMA_VERSION) {
      // Daha yeni bir sürümün verisi: bozmamak için yazmayı kapat.
      readOnly = true;
      const { state } = sanitizeUserState(obj);
      return { state, outcome: "recovered" };
    }
    let migrated = false;
    if (version < CURRENT_USER_SCHEMA_VERSION) {
      try {
        await backup(raw);
        obj = migrate(obj, CURRENT_USER_SCHEMA_VERSION, steps);
        migrated = true;
      } catch (e) {
        onError(e);
        return { state: createDefaultUserState(), outcome: "recovered" };
      }
    }

    const { state, droppedCount } = sanitizeUserState(obj);
    if (droppedCount > 0 && !migrated) await backup(raw);
    return { state, outcome: migrated ? "migrated" : droppedCount > 0 ? "repaired" : "loaded" };
  }

  async function write(state: UserState) {
    if (readOnly) return;
    try {
      await store.setItem(USER_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      onError(e);
    }
  }

  /** Yazmayı planlar; kısa süre içindeki ardışık kayıtlar tek yazmada birleşir. */
  function save(state: UserState) {
    pending = state;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  }

  /** Bekleyen yazmayı hemen yapar (ör. uygulama arka plana geçerken). */
  function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const toWrite = pending;
    pending = null;
    if (toWrite) writing = writing.then(() => write(toWrite));
    return writing;
  }

  async function reset(): Promise<UserState> {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
    await writing;
    readOnly = false;
    const fresh = createDefaultUserState();
    await write(fresh);
    return fresh;
  }

  return { load, save, flush, reset };
}

export type UserStateRepository = ReturnType<typeof createUserStateRepository>;
