import { addToReviewList } from "@/domain/progress/userStateUpdates";
import { createUserStore } from "@/services/progress/userStore";
import { createUserStateRepository } from "@/services/storage/userStateRepository";

import { createMemoryStore } from "../../fixtures/memoryStore";

describe("userStore", () => {
  it("güncellemeleri dinleyicilere bildirir ve kalıcı olarak saklar", async () => {
    const store = createMemoryStore();
    const us = createUserStore(createUserStateRepository({ store, onError: () => {} }));
    await us.hydrate();
    const listener = jest.fn();
    us.subscribe(listener);

    us.update((s) => addToReviewList(s, "a1-to-be", 1));
    expect(listener).toHaveBeenCalledTimes(1);
    us.update((s) => addToReviewList(s, "a1-to-be", 2)); // değişiklik yok
    expect(listener).toHaveBeenCalledTimes(1);
    await us.flush();

    const reopened = createUserStore(createUserStateRepository({ store, onError: () => {} }));
    await reopened.hydrate();
    expect(reopened.getState().reviewList).toEqual([{ lessonId: "a1-to-be", addedAt: 1 }]);
  });
});
