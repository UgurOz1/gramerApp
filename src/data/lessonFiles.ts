import aArticles from "@/assets/data/levels/a1/a1-articles.json";
import aPlurals from "@/assets/data/levels/a1/a1-plurals.json";
import aDemonstratives from "@/assets/data/levels/a1/a1-demonstratives.json";
import aPossessives from "@/assets/data/levels/a1/a1-possessives.json";
import aThereIs from "@/assets/data/levels/a1/a1-there-is-are.json";
import aSomeAny from "@/assets/data/levels/a1/a1-countable-some-any.json";
import aFreq from "@/assets/data/levels/a1/a1-adverbs-frequency.json";
import aWh from "@/assets/data/levels/a1/a1-wh-questions.json";
import aCan from "@/assets/data/levels/a1/a1-can.json";
import aHaveGot from "@/assets/data/levels/a1/a1-have-got.json";
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
  "a1-have-got": aHaveGot,
  "a1-articles": aArticles,
  "a1-plurals": aPlurals,
  "a1-demonstratives": aDemonstratives,
  "a1-possessives": aPossessives,
  "a1-there-is-are": aThereIs,
  "a1-countable-some-any": aSomeAny,
  "a1-adverbs-frequency": aFreq,
  "a1-wh-questions": aWh,
  "a1-can": aCan,
  "a1-to-be": aToBe,
  "a1-present-simple": aPresentSimple,
  "a1-present-continuous": aPresentContinuous,
  "a2-past-simple": a2PastSimple,
};
