import { formatPercent } from "@/utils/format";

describe("formatPercent", () => {
  it.each([
    [0, "%0"],
    [1, "%100"],
    [0.5, "%50"],
    [0.426, "%43"],
    [0.1, "%10"],
    [0.0996, "%10"],
  ])("%p → %s", (value, expected) => expect(formatPercent(value)).toBe(expected));

  it("%10'un altındaki küçük değerleri ondalıkla gösterir", () => {
    expect(formatPercent(0.003)).toBe("%0,3");
    expect(formatPercent(0.0425)).toBe("%4,3");
    expect(formatPercent(0.0004)).toBe("%0");
  });

  it("geçersiz ve aralık dışı değerlerde güvenlidir", () => {
    expect(formatPercent(NaN)).toBe("%0");
    expect(formatPercent(-1)).toBe("%0");
    expect(formatPercent(7)).toBe("%100");
  });
});
