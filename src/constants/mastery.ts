import type { MasteryBand } from "@/domain/models";

/** Konu ustalığı ağırlıkları (toplamı 1). Hesap bu dosyadan beslenir. */
export const MASTERY_WEIGHTS = {
  /** Konu alıştırmalarındaki başarı */
  practice: 0.4,
  /** Konu sonu sınavı */
  exam: 0.4,
  /** Farklı soru türlerindeki uygulama başarısı */
  variety: 0.2,
} as const;

/** Puan eşikleri (alt sınır dahil). */
export const MASTERY_BANDS: { min: number; band: Exclude<MasteryBand, "not_enough_data"> }[] = [
  { min: 80, band: "strong" },
  { min: 60, band: "good" },
  { min: 40, band: "beginner" },
  { min: 0, band: "needs_work" },
];

/** Ustalık iddia edilebilmesi için konudan cevaplanması gereken farklı soru sayısı. */
export const MIN_ANSWERED_FOR_MASTERY = 10;

/** Bu puanın altındaki ustalık "tekrar gerekli" sayılır (yeterli veri varsa). */
export const REVIEW_NEEDED_BELOW = 60;

/** Karışık testlerde başarı sınırı (yüzde). Konu sınavlarının sınırı kendi içeriğindedir. */
export const DEFAULT_PASS_PERCENT = 70;
