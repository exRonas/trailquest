# Project Context: TrailQuest (рабочее название)

## Quick Info
- **Project:** Мобильное приложение для пеших маршрутов с историческими/опасными метками, live-навигацией и форумом советов
- **Language:** TypeScript (mobile + backend)
- **Framework:** React Native (bare CLI) + Node.js/Express
- **Status:** In Progress (Phase 1 — MVP без AR)

## Technology Stack

### Mobile
- React Native (bare CLI, не Expo managed) — TypeScript
- `@rnmapbox/maps` — карты
- `react-native-background-geolocation` — фоновый GPS-трекинг
- React Navigation (stack + bottom tabs)
- Zustand — state management
- React Query — серверный стейт / кеширование запросов

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (без PostGIS в v1 — plain lat/lng + Haversine)
- Prisma ORM
- JWT-аутентификация
- Zod — валидация входных данных

### Maps
- Mapbox (Maps SDK, кастомный стиль, офлайн-тайлы)

### Admin Panel (Phase 1.5 — после ядра мобилки)
- Next.js + TypeScript, тот же backend API

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
│   │   │   └── Profile/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── store/           # zustand stores
│   │   ├── api/             # API client, react-query hooks
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── docs/
    ├── TECHNICAL_SPEC.md
    └── CLAUDE_CODE_BUILD_PROMPT.md
```

## Key Requirements
- Mobile-first, **качество важнее скорости разработки**
- Дизайн — не дефолтный/шаблонный, продуманный UX, плавные анимации
- Live-навигация по маршруту: скорость, дистанция, прогресс (как в обычных картах/Strava)
- Гео-триггеры чекпоинтов (auto-detect при входе в радиус)
- Метки трёх типов: историческая справка / предупреждение об опасности / "скоро будет"
- Советы и предупреждения привязаны к маршруту/точке, показываются при выборе маршрута
- Отдельный раздел "Форум" — советы по маршрутам от пользователей
- **AR (камера + оверлеи) — Фаза 2, НЕ строим сейчас**, но модель данных Checkpoint должна быть AR-ready (altitude, точные координаты) без миграций в будущем
- Админ-панель — после того как ядро мобилки готово

## Code Conventions
- TypeScript strict mode везде
- Backend: контроллеры тонкие, бизнес-логика в services
- Mobile: компоненты без бизнес-логики, вся логика в hooks/store
- Комментарии только для нетривиальной логики (геотриггеры, Haversine, фоновый трекинг)

## Important Commands
```bash
# Backend
cd backend && npm run dev
npx prisma migrate dev
npx prisma studio

# Mobile
cd mobile && npx react-native run-ios
cd mobile && npx react-native run-android
```

## Dependencies
См. CLAUDE_CODE_BUILD_PROMPT.md — полный список с версиями указан там для воспроизводимости.

## Important Notes
- Mapbox требует token (public + secret) — добавить в .env, не коммитить
- `react-native-background-geolocation` — есть бесплатный dev-режим (ограничен по времени использования в проде), платная лицензия для прода — учесть при коммерциализации
- Checkpoint.radius_trigger_m — настраиваемый радиус срабатывания, дефолт ~30м (точность GPS на пересечённой местности может скакать)
- Forum в v1 — без модерации (добавим в Phase 1.5 вместе с админкой)

## Last Updated
- **Date:** 2026-06-29
- **Changes:** Изначальная архитектура и спецификация определены
