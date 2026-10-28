import type { KeyValueStore } from "@/services/storage/keyValueStore";

export function createMemoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const store: KeyValueStore & { data: Map<string, string>; writes: number } = {
    data,
    writes: 0,
    async getItem(k) {
      return data.has(k) ? data.get(k)! : null;
    },
    async setItem(k, v) {
      store.writes++;
      data.set(k, v);
    },
    async removeItem(k) {
      data.delete(k);
    },
  };
  return store;
}
