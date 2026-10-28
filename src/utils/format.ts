/** 0–1 arası değeri "%42" olarak yazar. %10'un altındaki küçük değerler ondalıkla gösterilir (ör. "%0,3"). */
export function formatPercent(value: number): string {
  const percent = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100;
  if (percent > 0 && percent < 10) {
    const rounded = Math.round(percent * 10) / 10;
    return `%${String(rounded).replace(".", ",")}`;
  }
  return `%${Math.round(percent)}`;
}
