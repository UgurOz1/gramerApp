# gramerApp

Expo (React Native) + Expo Router + TypeScript projesi.

## Başlangıç

```bash
npm install
npm start
```

- `npm run android` — Android emülatör/cihaz
- `npm run ios` — iOS simülatör (yalnızca macOS)
- `npm run web` — web
- `npm run lint` — lint

## Klasör yapısı

```
src/
├── app/          # Sadece ekranlar ve layout dosyaları (Expo Router)
├── components/   # Yeniden kullanılabilir bileşenler
├── constants/    # Sabitler, tema renkleri
└── hooks/        # Özel React hook'ları
assets/
└── images/       # Uygulama ikonu, splash vb.
```

`@/*` takma adı `src/*` klasörüne işaret eder (ör. `import { x } from '@/components/x'`).
