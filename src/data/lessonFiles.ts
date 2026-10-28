import aPronouns from "@/assets/data/levels/a1/a1-pronouns-sentence.json";
import aToBe from "@/assets/data/levels/a1/a1-to-be.json";
import a2PastSimple from "@/assets/data/levels/a2/a2-past-simple.json";
import aPresentContinuous from "@/assets/data/levels/a1/a1-present-continuous.json";
import aPresentSimple from "@/assets/data/levels/a1/a1-present-simple.json";

/**
 * Ders içerik dosyalarının kaydı. Metro, JSON dosyalarını yalnızca statik
 * import ile pakete ekleyebildiği için her yeni ders buraya eklenir.
 * Anahtar, müfredattaki ders kimliğidir.
 */
export const lessonFiles: Record<string, unknown> = {
  "a1-pronouns-sentence": aPronouns,
  "a1-to-be": aToBe,
  "a1-present-simple": aPresentSimple,
  "a1-present-continuous": aPresentContinuous,
  "a2-past-simple": a2PastSimple,
};
