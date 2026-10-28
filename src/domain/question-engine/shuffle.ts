/** Metinden sabit bir sayı üretir (aynı soru her açılışta aynı karışıklığı görsün diye). */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Tohuma bağlı, tekrarlanabilir karıştırma. Orijinal dizi değişmez. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  let state = hashSeed(seed) || 1;
  const next = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Karıştırılan dizinin, doğru sıradaki hâlinden farklı çıkmasını sağlar. */
export function shuffleDifferent<T>(items: readonly T[], seed: string): T[] {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shuffled = seededShuffle(items, `${seed}#${attempt}`);
    if (items.length < 2 || shuffled.some((x, i) => x !== items[i])) return shuffled;
  }
  return [...items].reverse();
}
