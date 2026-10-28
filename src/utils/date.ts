/** Tarihi Türkçe, okunaklı biçimde yazar (ör. "12 Mart 2026"). */
export function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}
