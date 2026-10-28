import { recordAnswer } from "@/domain/progress/userStateUpdates";
import { USER_STATE_KEY, createUserStateRepository } from "@/services/storage/userStateRepository";
import { CURRENT_USER_SCHEMA_VERSION, createDefaultUserState } from "@/services/storage/userStateSchema";

import { createMemoryStore } from "../../fixtures/memoryStore";

const quiet = { onError: () => {} };
const backups = (store: ReturnType<typeof createMemoryStore>) =>
  [...store.data.keys()].filter((k) => k.includes("backup"));

describe("userStateRepository", () => {
  it("kayıt yoksa varsayılan durumu döndürür", async () => {
    const repo = createUserStateRepository({ store: createMemoryStore(), ...quiet });
    const res = await repo.load();
    expect(res.outcome).toBe("empty");
    expect(res.state).toEqual(createDefaultUserState());
  });

  it("yazılan durumu yeniden açılışta geri yükler", async () => {
    const store = createMemoryStore();
    const repo = createUserStateRepository({ store, ...quiet });
    const state = { ...createDefaultUserState(), lastLessonId: "a1-to-be" };
    repo.save(state);
    await repo.flush();

    const reopened = createUserStateRepository({ store, ...quiet });
    const res = await reopened.load();
    expect(res.outcome).toBe("loaded");
    expect(res.state).toEqual(state);
  });

  it("bozuk JSON'da çökmez, veriyi yedekler ve varsayılan durumla açılır", async () => {
    const store = createMemoryStore({ [USER_STATE_KEY]: "{bozuk" });
    const res = await createUserStateRepository({ store, ...quiet }).load();
    expect(res.outcome).toBe("recovered");
    expect(res.state).toEqual(createDefaultUserState());
    expect(backups(store)).toHaveLength(1);
    expect(store.data.get(backups(store)[0])).toBe("{bozuk");
  });

  it("JSON nesne değilse kurtarır", async () => {
    const store = createMemoryStore({ [USER_STATE_KEY]: "[1,2]" });
    expect((await createUserStateRepository({ store, ...quiet }).load()).outcome).toBe("recovered");
  });

  it("okuma hatasında çökmez", async () => {
    const store = createMemoryStore();
    store.getItem = async () => {
      throw new Error("disk");
    };
    const res = await createUserStateRepository({ store, ...quiet }).load();
    expect(res.outcome).toBe("recovered");
  });

  it("geçersiz alanları tek tek atar, geçerli veriyi korur", async () => {
    const good = recordAnswer(createDefaultUserState(), {
      attemptId: "a1",
      questionId: "q-1",
      lessonId: "a1-to-be",
      questionType: "fill_blank",
      selectedAnswer: "is",
      normalizedAnswer: "is",
      isCorrect: false,
      timestamp: 1,
      sessionId: "s",
      mode: "practice",
    });
    const damaged = {
      ...good,
      attempts: [...good.attempts, { attemptId: 5 }],
      reviewList: [{ lessonId: "a1-to-be", addedAt: 1 }, { lessonId: "a1-to-be", addedAt: 2 }, "x"],
      preferences: { showHints: "evet" },
      lessonProgress: { "a1-to-be": { lessonId: "farkli", firstOpenedAt: 1, lastOpenedAt: 1 } },
    };
    const store = createMemoryStore({ [USER_STATE_KEY]: JSON.stringify(damaged) });
    const res = await createUserStateRepository({ store, ...quiet }).load();
    expect(res.outcome).toBe("repaired");
    expect(res.state.attempts).toHaveLength(1);
    expect(res.state.mistakes["q-1"].wrongCount).toBe(1);
    expect(res.state.reviewList).toEqual([{ lessonId: "a1-to-be", addedAt: 1 }]);
    expect(res.state.preferences.showHints).toBe(true);
    expect(res.state.lessonProgress).toEqual({});
    expect(backups(store)).toHaveLength(1);
  });

  it("eski şema sürümünü geçiş adımlarıyla yükseltir", async () => {
    const old = { ...createDefaultUserState(), schemaVersion: 0, lastLesson: "a1-to-be" } as Record<string, unknown>;
    delete old.lastLessonId;
    const store = createMemoryStore({ [USER_STATE_KEY]: JSON.stringify(old) });
    const repo = createUserStateRepository({
      store,
      ...quiet,
      migrations: { 0: ({ lastLesson, ...rest }) => ({ ...rest, lastLessonId: lastLesson }) },
    });
    const res = await repo.load();
    expect(res.outcome).toBe("migrated");
    expect(res.state.schemaVersion).toBe(CURRENT_USER_SCHEMA_VERSION);
    expect(res.state.lastLessonId).toBe("a1-to-be");
  });

  it("daha yeni sürümün verisinin üzerine yazmaz", async () => {
    const future = JSON.stringify({ ...createDefaultUserState(), schemaVersion: 99 });
    const store = createMemoryStore({ [USER_STATE_KEY]: future });
    const repo = createUserStateRepository({ store, ...quiet });
    await repo.load();
    repo.save(createDefaultUserState());
    await repo.flush();
    expect(store.data.get(USER_STATE_KEY)).toBe(future);
  });

  it("ardışık kayıtları tek yazmada birleştirir", async () => {
    jest.useFakeTimers();
    try {
      const store = createMemoryStore();
      const repo = createUserStateRepository({ store, debounceMs: 300, ...quiet });
      for (let i = 0; i < 10; i++) repo.save({ ...createDefaultUserState(), lastLessonId: `l-${i}` });
      expect(store.writes).toBe(0);
      jest.advanceTimersByTime(300);
      await repo.flush();
      expect(store.writes).toBe(1);
      expect(JSON.parse(store.data.get(USER_STATE_KEY)!).lastLessonId).toBe("l-9");
    } finally {
      jest.useRealTimers();
    }
  });

  it("sıfırlama varsayılan durumu yazar", async () => {
    const store = createMemoryStore();
    const repo = createUserStateRepository({ store, ...quiet });
    repo.save({ ...createDefaultUserState(), lastLessonId: "x" });
    const fresh = await repo.reset();
    expect(fresh).toEqual(createDefaultUserState());
    expect(JSON.parse(store.data.get(USER_STATE_KEY)!)).toEqual(createDefaultUserState());
  });
});
