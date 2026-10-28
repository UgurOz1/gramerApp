/**
 * Serbest metin cevaplarını karşılaştırmak için normalize eder:
 * - baştaki/sondaki boşluklar silinir, çoklu boşluklar teke iner
 * - büyük/küçük harf farkı yok sayılır
 * - kıvrık tırnak/kesme işaretleri (’ ‘ “ ”) düz biçime çevrilir
 * - noktalama öncesindeki boşluklar silinir, cümle sonu noktalaması (. ! ?) yok sayılır
 *
 * Kısaltmalar (doesn't / does not) otomatik eşdeğer SAYILMAZ; içerikte açıkça listelenmelidir.
 */
export function normalizeAnswer(input: string): string {
  return input
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim()
    .replace(/[.!?]+$/, "")
    .trim()
    .toLowerCase();
}
