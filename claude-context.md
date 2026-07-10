# Project Context: TrailQuest (рабочее название)

## Quick Info
- **Project:** Мобильное приложение для пеших маршрутов с историческими/опасными метками, live-навигацией (QR-чекпоинты + XP/уровни/ранги по странам), форумом советов, отзывами/достижениями/друзьями/лидербордом и браузерной админкой
- **Language:** TypeScript (mobile + backend + admin)
- **Framework:** React Native (bare CLI) + Node.js/Express + Vite/React (admin)
- **Status:** Live — v2.14, единственный дизайн "Atlas", хостинг на Render+Neon,
  лендинг на GitHub Pages (exronas.github.io/trailquest). AR (Phase 2) всё ещё
  не реализована — единственный крупный кусок из исходной спеки, который не построен.
  Полная история по раундам: `docs/ADMIN_WEB_PROGRESS.md`.

## Technology Stack

### Mobile
- React Native (bare CLI, не Expo managed) — TypeScript
- `@rnmapbox/maps` — карты
- `@react-native-community/geolocation` — GPS (заменил платный `react-native-background-geolocation`, см. Round 6 в ADMIN_WEB_PROGRESS.md)
- `react-native-camera-kit` — сканирование QR-чекпоинтов
- React Navigation (stack + bottom tabs)
- Zustand — state management (auth/session/theme)
- React Query — серверный стейт / кеширование запросов
- `react-native-svg`, `react-native-reanimated` 4.x, `react-native-gesture-handler` — декор и анимации дизайна Atlas
- `react-native-view-shot` + `react-native-share` — шаринг статистики картинкой
- `@react-native-async-storage/async-storage` — офлайн-очередь и кеш маршрутов

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (Neon, без PostGIS — plain lat/lng + Haversine)
- Prisma ORM
- JWT-аутентификация
- Zod — валидация входных данных
- Хостинг: Render (backend, free tier + keep-alive пинг) + Neon (DB, Frankfurt)

### Maps
- Mapbox (Maps SDK, кастомный стиль, dark/light варианты, офлайн-тайлы — реализовано)
- Road-snapping (Mapbox Directions) считается в админке при сохранении маршрута

### Admin Panel — построена
- Vite + React + TypeScript SPA (`admin/`), тот же backend API
- Редактор маршрутов с картой, генерация QR чекпоинтов, RU/EN/KK редактирование контента, загрузка изображений, модерация форума, аналитика

## Project Structure
```
trailquest/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/      # auth, validation, error handling
│   │   ├── prisma/          # schema.prisma, migrations
│   │   └── utils/           # haversine, geo-helpers
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Auth/
│   │   │   ├── Explore/         # карта + список маршрутов
│   │   │   ├── RouteDetail/
│   │   │   ├── ActiveNavigation/
│   │   │   ├── Forum/
│   │   │   └── Profile/         # + Friends, Leaderboard, Achievements
│   │   ├── components/          # ui/ примитивы + components/decor/ (SVG Atlas)
│   │   ├── navigation/
│   │   ├── store/           # zustand stores
│   │   ├── api/             # API client, react-query hooks
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── admin/                   # Vite + React admin panel
├── site/                    # статический лендинг (GitHub Pages)
├── render.yaml               # Render Blueprint (backend deploy)
└── docs/
    ├── TECHNICAL_SPEC.md
    ├── ADMIN_WEB_PROGRESS.md   # живой лог по раундам — самый актуальный источник
    └── CLAUDE_CODE_BUILD_PROMPT.md
```

## Key Requirements
- Mobile-first, **качество важнее скорости разработки**
- Дизайн — не дефолтный/шаблонный, продуманный UX, плавные анимации. Единственный
  дизайн сейчас — "Atlas" (expedition/archive стиль); Pine и Terra были более
  ранними переключаемыми вариантами, архивированы в `mobile/src/theme/archive/legacyDesigns.ts`
- Live-навигация по маршруту: скорость, дистанция, прогресс (как в обычных картах/Strava)
- Чекпоинты отмечаются **сканированием QR-кода** (не гео-триггером — это изменилось
  относительно исходной спеки, см. Round 7 в ADMIN_WEB_PROGRESS.md), даёт XP и уровень/ранг по стране
- Метки трёх типов: историческая справка / предупреждение об опасности / "скоро будет"
- Советы и предупреждения привязаны к маршруту/точке, показываются при выборе маршрута
- Отдельный раздел "Форум" — советы по маршрутам от пользователей, с модерацией
- **AR (камера + оверлеи) — Фаза 2, всё ещё НЕ построена**, но модель данных Checkpoint остаётся AR-ready (altitude, точные координаты)
- Админ-панель — построена и активно используется

## Code Conventions
- TypeScript strict mode везде
- Backend: контроллеры тонкие, бизнес-логика в services
- Mobile: компоненты без бизнес-логики, вся логика в hooks/store
- Комментарии только для нетривиальной логики (геотриггеры, Haversine, фоновый трекинг)

## Important Commands
```bash
# Backend
cd backend && npm run dev        # http://localhost:4001
npx prisma migrate dev
npx prisma studio

# Mobile
cd mobile && npx react-native run-ios
cd mobile && npx react-native run-android

# Admin
cd admin && npm run dev          # http://localhost:5173
```

## Dependencies
См. CLAUDE_CODE_BUILD_PROMPT.md для исходного списка (Phase 1 MVP); с тех пор
добавлено много зависимостей по ходу разработки — актуальный список всегда
в package.json каждого проекта.

## Important Notes
- Mapbox требует token (public + secret) — добавить в .env, не коммитить
- Checkpoint.radiusTriggerM больше не используется для авто-детекта (QR заменил
  гео-триггер), но поле сохранено в схеме
- Live-бекенд: https://trailquest-backend-uze0.onrender.com (Render + Neon,
  Frankfurt) — держится "тёплым" через cron-job.org пинг каждые 10 мин
- Лендинг + APK: https://exronas.github.io/trailquest
- Полная, актуальная история по каждому раунду разработки — в
  `docs/ADMIN_WEB_PROGRESS.md`, включая честный список того, что ещё не сделано

## Last Updated
- **Date:** 2026-07-10
- **Changes:** Синхронизировано с фактическим состоянием проекта (v2.14, Atlas —
  единственный дизайн, хостинг Render+Neon, лендинг на GitHub Pages, QR-чекпоинты
  с XP/рангами, отзывы/достижения/друзья/лидерборд, офлайн-режим, браузерная
  админка). См. `docs/ADMIN_WEB_PROGRESS.md` для полной детализации по раундам.
