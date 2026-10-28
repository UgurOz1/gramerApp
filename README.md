# GrammarPath

Türkçe konuşanlar için A1–B2 İngilizce gramer öğrenme uygulaması.
Expo (React Native) + Expo Router + TypeScript. Tamamen çevrimdışı çalışır.

Mimari ve aşama planı: [docs/PLAN.md](docs/PLAN.md)

## Başlangıç

```bash
npm install
npx expo start      # Expo Go ile QR kodu okut
```

- `npm run android` / `npm run ios` — emülatör/simülatör
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript kontrolü
- `npm test` — birim testleri (içerik doğrulama dahil)

## Klasör yapısı

```
assets/data/        # Müfredat ve ders içerikleri (JSON)
src/
├── app/            # Yalnızca ekranlar ve layout dosyaları (Expo Router)
├── components/     # common/ (temel bileşenler), progress/ …
├── data/           # Paketlenmiş içeriğin yüklenmesi ve doğrulanması
├── domain/         # Tipler, doğrulama, cevap ve ilerleme mantığı (saf TS)
├── features/       # Ekranlara veri hazırlayan modüller
├── services/       # Yerel depolama ve uygulama durumu
└── theme/          # Renkler, boşluklar, tipografi
tests/              # Jest testleri
docs/               # Plan ve mimari notlar
```

`@/*` → `src/*`, `@/assets/*` → `assets/*`.
