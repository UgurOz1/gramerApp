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

### Aşama 4: öğrenme motoru

- **Ustalık** (`domain/scoring/mastery.ts`, ağırlıklar `constants/mastery.ts`): alıştırma başarısı %40 +
  son konu sınavı %40 + soru türü çeşitliliği %20. Her soru için *son* cevap sayılır; yanlış sonra
  doğru çözülünce ustalık artar. En az 10 farklı soru cevaplanmadan band verilmez; konu sınavı hiç
  çözülmediyse en yüksek band "İyi" ile sınırlıdır. Ustalık saklanmaz, cevap geçmişinden hesaplanır.
  Ders durumu ("Tekrar gerekli", "Ustalık kazanıldı") ustalıkla birlikte türetilir (`lessonStatus.ts`).
- **Yanlışlarım** (`mistakes/`): soru kimliğiyle tekil kayıt; tekrar çözme `mistakes` modunda yapılır,
  doğru çözülünce kayıt "Çözüldü" olur ama silinmez. Listeden kaldırmak geçmişi ve sınav sonuçlarını silmez.
- **Tekrar listem** (`review/`): kullanıcının seçtiği konular; yanlışlardan ayrı. Sınav geçmişi buradan
  yeniden çözülebilir (her deneme ayrı kayıt).
- **Karışık test** (`mixed/`): kapsam (tümü / seviye / ünite / seçili konular / yanlış yapılan konular /
  tekrar listem), soru türleri ve soru sayısı seçilir. `buildMixedTest` konulara dengeli dağıtır ve
  tohumla tekrarlanabilir. Sınav gibi çözülür (`kind: "mixed"`); konu sınavını tamamlanmış saymaz.
- **Ana sayfa:** genel ilerleme (ders tamamlama + ustalık; içeriği hazır olmayan konular 0 sayılır),
  seviye ilerlemesi, günün önerisi (`suggestToday`, yalnızca yerel veriye dayanır), kısayollar, kısa istatistik.
- **Ortak akışlar:** `PracticeRunner` (anında geri bildirimli tur) ve `ExamRunner` (sınav) bileşenleri
  alıştırma, yanlış tekrarı ve karışık test tarafından paylaşılır.

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

## Eklenecek konular (yedek liste — henüz müfredata işlenmedi)

Standart A1–B2 programlarıyla karşılaştırınca eksik görünen 16 konu. Bunlar eklenince müfredat 104 → **120 konu** olur.
Sırayla, ilgili seviyenin kendi içeriği bittikten sonra `assets/data/curriculum.json` içine eklenecek
(kimlikler sabit kalacak, mevcut ilerleme bozulmayacak).

| Seviye | Konu | Önerilen ön koşul |
| --- | --- | --- |
| A1 | Would like / want / let's: istek ve öneri | a1-to-be |
| A1 | How much / how many | a1-countable-some-any |
| A1 | Like / love / hate + -ing | a1-present-simple |
| A2 | Can / could / may: izin, rica ve teklif | a1-can |
| A2 | Yansıma zamirleri (myself, yourself …) | a1-object-pronouns |
| A2 | -ed / -ing sıfatlar (bored / boring) | a2-adjectives-adverbs |
| A2 | Fiil + edat (listen to, look at, wait for) | a1-present-simple |
| A2 | Phrasal verbs: giriş | a2-past-simple |
| B1 | Zaman cümlecikleri (when, while, as soon as, until) | a2-first-conditional |
| B1 | Amaç cümlecikleri (to, in order to, so that) | b1-verb-patterns |
| B1 | Dolaylı sorular (Could you tell me where …) | b1-reported-questions |
| B1 | May / might ile olasılık | b1-modals-deduction |
| B1 | Sıfat sırası | a2-adjectives-adverbs |
| B1 | Phrasal verbs: ayrılabilen ve ayrılamayan | (A2 phrasal verbs giriş) |
| B2 | Let / make / allow / be allowed to | b1-verb-patterns |
| B2 | Need / needn't / don't need to ayrıntıları | a2-must-have-to |

**Çalışma sırası (karar):** önce A1'in kalan konuları, ardından A2; her seferinde tek ders, adım adım.
Kaynak notu: resmî bir CEFR gramer listesi yoktur; seviye ataması kaynaklara göre değişebilir (özellikle koşul cümleleri,
edilgen yapı ve dolaylı anlatım). Ayrıntılı listeler (Cambridge English Grammar Profile vb.) okunabilirse bu tablo gözden geçirilir.

## Aşamalar

1. **İskelet** — tema, ortak bileşenler, sekmeli navigasyon, ana sayfa,
   müfredat ve seviye ekranları, müfredat kataloğu. ✅
2. **Veri mimarisi** — tüm tipler, içerik doğrulayıcı (uygulama açılışında +
   test), depolama katmanı, Jest kurulumu ve temel testler. ✅
3. **İlk ders (A1 To Be)** — ders ekranı, 5 soru türü, alıştırma akışı,
   konu sonu sınavı, ilerleme kaydı. Uçtan uca doğrulama. ✅
4. **Öğrenme motoru** — puanlama, ustalık, yanlışlar, tekrar listesi, karışık test. ✅
5. **İçerik** — kalan 7 örnek ders, karşılaştırmalar, sonra A1→B2 genişletme.
   *Devam ediyor:* A1 Present Simple, A1 Present Continuous, A2 Past Simple, üç karşılaştırma
   (Present Simple vs Continuous, Present Perfect vs Past Simple, First vs Second Conditional) ve
   karşılaştırma ekranı hazır. **A1, A2 ve B1 tamamlandı** (A1: 21 / 21, A2: 28 / 28, B1: 28 / 28 konu; karşılaştırmalar dahil).
   **Sıradaki:** B2 (27 konu). **Kalan örnek ders:** B2 Passive Voice ileri kullanım.
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
