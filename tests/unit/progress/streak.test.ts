import { computeStreak, dayKey } from "@/features/progress/streak";

const day = (offset: number, hour = 10) => {
  const d = new Date(2026, 9, 29, hour);
  d.setDate(d.getDate() + offset);
  return d.getTime();
};
const now = day(0, 18);

describe("computeStreak", () => {
  it("hiç cevap yoksa seri sıfırdır", () => {
    const s = computeStreak([], now);
    expect(s.current).toBe(0);
    expect(s.activeToday).toBe(false);
    expect(s.todayCount).toBe(0);
    expect(s.week).toHaveLength(7);
    expect(s.week.every((w) => !w.active)).toBe(true);
  });

  it("bugün dahil art arda günleri sayar", () => {
    const s = computeStreak([{ timestamp: day(0) }, { timestamp: day(0, 11) }, { timestamp: day(-1) }, { timestamp: day(-2) }], now);
    expect(s.current).toBe(3);
    expect(s.activeToday).toBe(true);
    expect(s.todayCount).toBe(2);
  });

  it("bugün henüz çalışılmadıysa dünkü seri korunur", () => {
    const s = computeStreak([{ timestamp: day(-1) }, { timestamp: day(-2) }], now);
    expect(s.current).toBe(2);
    expect(s.activeToday).toBe(false);
  });

  it("bir gün boşluk seriyi bozar", () => {
    const s = computeStreak([{ timestamp: day(0) }, { timestamp: day(-2) }, { timestamp: day(-3) }], now);
    expect(s.current).toBe(1);
  });

  it("haftalık görünüm eskiden yeniye sıralıdır ve son gün bugündür", () => {
    const s = computeStreak([{ timestamp: day(-6) }, { timestamp: day(0) }], now);
    expect(s.week[6].key).toBe(dayKey(now));
    expect(s.week[0].active).toBe(true);
    expect(s.week[6].active).toBe(true);
    expect(s.week.slice(1, 6).some((w) => w.active)).toBe(false);
  });
});
