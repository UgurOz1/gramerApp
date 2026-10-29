import a2PsVsPc from "@/assets/data/comparisons/a2-past-simple-vs-continuous.json";
import a2WillVsGt from "@/assets/data/comparisons/a2-will-vs-going-to.json";
import b1Cond from "@/assets/data/comparisons/b1-first-vs-second-conditional.json";
import a2PpVsPs from "@/assets/data/comparisons/a2-present-perfect-vs-past-simple.json";
import a1PsVsPc from "@/assets/data/comparisons/a1-present-simple-vs-continuous.json";
import b1PpAdv from "@/assets/data/comparisons/b1-present-perfect-vs-past-advanced.json";

/**
 * Karşılaştırma içerik dosyalarının kaydı (assets/data/comparisons/<id>.json).
 * Anahtar, müfredattaki karşılaştırma dersinin kimliğidir.
 */
export const comparisonFiles: Record<string, unknown> = {
  "a1-present-simple-vs-continuous": a1PsVsPc,
  "a2-present-perfect-vs-past-simple": a2PpVsPs,
  "a2-past-simple-vs-continuous": a2PsVsPc,
  "a2-will-vs-going-to": a2WillVsGt,
  "b1-first-vs-second-conditional": b1Cond,
  "b1-present-perfect-vs-past-advanced": b1PpAdv,
};
