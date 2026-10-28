/**
 * Şema geçişleri: anahtar, geçişin başladığı sürümdür (n → n+1).
 * Yeni bir alan eklenip şema sürümü artırıldığında buraya bir adım eklenir.
 * Örnek: 1: (s) => ({ ...s, schemaVersion: 2, yeniAlan: [] })
 */
export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Record<number, Migration> = {};

export function migrate(
  raw: Record<string, unknown>,
  targetVersion: number,
  steps: Record<number, Migration> = migrations,
): Record<string, unknown> {
  let current = raw;
  let version = typeof current.schemaVersion === "number" ? current.schemaVersion : 0;
  while (version < targetVersion) {
    const step = steps[version];
    if (!step) throw new Error(`Şema geçişi bulunamadı: v${version} → v${version + 1}`);
    current = step(current);
    version += 1;
    current = { ...current, schemaVersion: version };
  }
  return current;
}
