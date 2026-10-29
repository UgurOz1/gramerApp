import type { AnswerAttempt } from "@/domain/models";

/** Günlük hedef: bir günde cevaplanacak soru sayısı. */
export const DAILY_GOAL = 20;

/** Yerel saate göre gün anahtarı (YYYY-MM-DD). */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function previousDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 1, 12).getTime());
}

export type StreakInfo = {
  /** Art arda çalışılan gün sayısı. Bugün henüz çalışılmadıysa dünden geriye sayılır. */
  current: number;
  /** Bugün çalışıldı mı? */
  activeToday: boolean;
  /** Bugün cevaplanan soru sayısı. */
  todayCount: number;
  /** Son 7 günün (eskiden yeniye) çalışılıp çalışılmadığı; son öğe bugündür. */
  week: { key: string; active: boolean }[];
};

/** Cevap geçmişinden günlük seri bilgisini çıkarır. Saf fonksiyondur. */
export function computeStreak(attempts: Pick<AnswerAttempt, "timestamp">[], now: number = Date.now()): StreakInfo {
  const counts = new Map<string, number>();
  for (const a of attempts) {
    const k = dayKey(a.timestamp);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = dayKey(now);
  const activeToday = counts.has(today);

  let current = 0;
  let cursor = activeToday ? today : previousDay(today);
  while (counts.has(cursor)) {
    current++;
    cursor = previousDay(cursor);
  }

  const week: StreakInfo["week"] = [];
  let k = today;
  for (let i = 0; i < 7; i++) {
    week.unshift({ key: k, active: counts.has(k) });
    k = previousDay(k);
  }

  return { current, activeToday, todayCount: counts.get(today) ?? 0, week };
}
