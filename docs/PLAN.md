# GrammarPath — Mimari ve Geliştirme Planı

Türkçe konuşanlar için A1–B2 İngilizce gramer uygulaması. Tamamen çevrimdışı,
hesap/backend/analitik yok.

## Mevcut durum (başlangıç)

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6 (strict)
- Expo Router (`src/app/`), typed routes ve React Compiler açık
- `@/*` → `src/*`, `@/assets/*` → `assets/*`
- Paket yöneticisi: npm (`package-lock.json`)

## Mimari

Üç katman birbirinden ayrı tutulur:

| Katman | Klasör | Sorumluluk |
| --- | --- | --- |
| İçerik | `assets/data/` | Müfredat, dersler, sorular, sınavlar, karşılaştırmalar (JSON) |
| Alan mantığı | `src/domain/` | Tipler, içerik doğrulama, cevap değerlendirme, puanlama, ustalık. Saf TypeScript; React yok. |
| Servisler | `src/services/` | Tek depolama katmanı (AsyncStorage), ilerleme servisi |
| Özellikler | `src/features/` | Ekranlara veri hazırlayan hook'lar ve seçiciler |
| Arayüz | `src/app/`, `src/components/` | Yalnızca ekranlar ve bileşenler |

Kurallar:

- Ekranlar AsyncStorage'a doğrudan erişmez; yalnızca `services/storage` kullanır.
- Cevap kontrolü, sınav puanı ve ustalık hesabı saf fonksiyonlardır ve test edilir.
- İçerik kimlikleri (`a1-to-be`, `q-to-be-01` …) değişmez; düzeltmeler kimlik korunarak yapılır.
- Ustalık ağırlıkları ve eşikleri tek bir yapılandırma dosyasında tutulur.

### Klasör yapısı (hedef)

```
assets/data/
  curriculum.json            # seviyeler, üniteler, ders kataloğu, ön koşullar
  comparisons.json           # karşılaştırmalı gramer içerikleri
  levels/a1/<ders-id>.json   # ders + örnekler + alıştırmalar + sınav
src/
  app/                       # Expo Router ekranları
    (tabs)/                  # Ana sayfa, Müfredat, Pratik, İstatistik
    level/[levelId].tsx
    lesson/[lessonId].tsx
    practice/[lessonId].tsx
    exam/[examId].tsx, exam/result.tsx
    mistakes.tsx, review.tsx, comparisons/…, settings.tsx
  components/common|lesson|exercise|progress
  domain/models|validation|scoring|question-engine
  services/storage|progress
  features/curriculum|lessons|practice|exams|…
  theme/
tests/unit, tests/integration
```

### Navigasyon

Kök `Stack` + alt sekmeler (`(tabs)`): **Ana Sayfa**, **Müfredat**, **Pratik**,
**İstatistik**. Ders, alıştırma, sınav, yanlışlar ve karşılaştırma ekranları
sekmelerin üzerine açılan Stack ekranlarıdır. Sekmeler yalnızca çalışır
durumdaki ekranlar için eklenir.

### Yerel veri (AsyncStorage)

Tek anahtar altında sürümlü bir kullanıcı durumu (`grammarpath/user-state`):

```
{ schemaVersion, lessonProgress, attempts[], examResults[], mistakes{questionId→kayıt},
  reviewList[], lastLessonId, preferences }
```

- Okunamayan/bozuk kayıt → varsayılan durum + bozuk kopya yedeklenir, uygulama çökmez.
- `migrations[]` ile sürüm yükseltme.
- Yazmalar kısa bir gecikmeyle birleştirilir (debounce); cevap geçmişi sınırlandırılır.
- Yanlışlar `questionId` ile anahtarlanır → kopya kayıt oluşmaz.
- Bozuk tek tek kayıtlar atılır, geri kalan veri korunur; ham veri önce yedeklenir.
- Daha yeni bir uygulama sürümünün verisi okunursa üzerine yazılmaz.
- Ustalık saklanmaz; cevap geçmişinden hesaplanır (tek doğruluk kaynağı).

### Aşama 3: öğrenme akışı

Rotalar: `lesson/[lessonId]` → `practice/[lessonId]` → `exam/[lessonId]` → `exam/result?resultId=…`

- **Ders:** bölümler JSON'dan çizilir (`SectionView`). Dersin sonuna kaydırmak dersi "okundu" yapar.
  Ders içi anlama kontrolü cevapları `lesson_check` modunda kaydedilir.
- **Alıştırma:** cevap sonrası anında geri bildirim. Atlanan soru kaydedilmez; tur sonunda
  atlananlar ve yanlışlar yeniden çözülebilir. Soruların %70'i cevaplanırsa alıştırmalar tamamlanır
  (`src/constants/progress.ts`).
- **Sınav:** cevaplar bitene kadar gösterilmez ve kaydedilmez; bitişte tek seferde puanlanır
  (`scoreExam`), her deneme ayrı kayıt olur. Atlanan soru yanlış sayılmaz ama puan getirmez.
- **Cevap değerlendirme:** `domain/question-engine/evaluate.ts` (UI'dan bağımsız). Kabul edilen
  alternatifler içerikte açıkça listelenir; listelenmeyen cevap otomatik doğru sayılmaz.
- **İlerleme servisi:** `services/progress/progressService.ts` ekranların tek giriş noktasıdır.
- **İçerik kalitesi testi:** `tests/unit/content/lessonContent.test.ts` her sorunun doğru cevabını,
  alternatiflerini ve yanlış cevap geri bildirimlerini değerlendiriciyle çalıştırarak doğrular.

İlk ders: `assets/data/levels/a1/a1-to-be.json` (30 örnek, 42 alıştırma, 20 soruluk sınav).
Yeni ders eklerken JSON'u `src/data/lessonFiles.ts` içine kaydet ve `npm test` çalıştır.

### Aşama 2 dosyaları

| Dosya | Görev |
| --- | --- |
| `src/domain/models/*` | Müfredat, ders, soru (türe göre ayrı tipler), karşılaştırma, kullanıcı verisi tipleri |
| `src/domain/validation/*` | Müfredat, ders ve karşılaştırma doğrulayıcıları |
| `src/domain/question-engine/normalize.ts` | Serbest metin cevap normalizasyonu |
| `src/domain/progress/userStateUpdates.ts` | Cevap kaydı, yanlışlar, tekrar listesi, ders adımları (saf fonksiyonlar) |
| `src/data/contentRepository.ts` | Paketlenmiş JSON'u bir kez yükler ve doğrular |
| `src/data/lessonFiles.ts` | Ders dosyalarının kaydı (Metro statik require ister) |
| `src/services/storage/*` | AsyncStorage deposu, şema onarımı, geçişler, birleştirilmiş yazma |
| `src/services/progress/userStore.ts` | Uygulama geneli durum + `useUserState()` |

### Ustalık

`ustalık = alıştırma %40 + sınav %40 + soru türü çeşitliliği %20`; asgari soru
sayısı karşılanmadan "Güçlü" gösterilmez. Ders tamamlama ayrı tutulur.

## Müfredat düzenlemesi

Verilen liste mekanik uygulanmadı; tekrar eden konular birleştirildi:

- A1: "To be" ile "olumlu/olumsuz/soru" tek ders; "Present Simple" ile
  "do/does" tek ders; "some/any" ile "sayılabilen/sayılamayan" tek ders.
- A2: "countable/uncountable" A1'de işlendiği için A2'de miktar belirleyicileriyle birleşti.
- B1: "Past Perfect" ile "Past Perfect vs Past Simple"; "gerund/infinitive" ile
  "verb patterns"; "relative pronouns" ile "defining relative clauses";
  iki çıkarım (deduction) dersi; "quantifiers" ile "both/either/neither/all";
  "linking words" ile "although/despite/however" birleşti.
- B2: "Passive ileri" ile "advanced passive constructions"; "reduced relative"
  ile "participle clauses"; "advanced articles/determiners" ile "advanced quantifiers" birleşti.

Toplam ders sayısı ve ön koşullar `assets/data/curriculum.json` içindedir.

## Aşamalar

1. **İskelet** — tema, ortak bileşenler, sekmeli navigasyon, ana sayfa,
   müfredat ve seviye ekranları, müfredat kataloğu. ✅
2. **Veri mimarisi** — tüm tipler, içerik doğrulayıcı (uygulama açılışında +
   test), depolama katmanı, Jest kurulumu ve temel testler. ✅
3. **İlk ders (A1 To Be)** — ders ekranı, 5 soru türü, alıştırma akışı,
   konu sonu sınavı, ilerleme kaydı. Uçtan uca doğrulama. ✅
4. **Öğrenme motoru** — puanlama, ustalık, yanlışlar, tekrar listesi, karışık test.
5. **İçerik** — kalan 7 örnek ders, karşılaştırmalar, sonra A1→B2 genişletme.
6. **İstatistikler ve iyileştirme** — istatistik ekranı, erişilebilirlik, küçük ekran.
7. **Yayına hazırlık** — EAS derlemeleri, ikon, gizlilik metni.

## Komutlar

```bash
npm install
npx expo start        # geliştirme sunucusu (Expo Go ile açılabilir)
npx expo lint
npx tsc --noEmit
npm test              # Aşama 2'den itibaren
```
