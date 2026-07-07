# Claude Code Build Prompt — TrailQuest MVP

Используй этот prompt целиком как первое сообщение Claude Code в новом проекте.

---

## Контекст

Строим production-grade мобильное приложение **TrailQuest** — навигатор по пешим маршрутам (исторические места, места сражений, смотровые точки) с гео-триггерами чекпоинтов и форумом советов. Полная спецификация — в `docs/TECHNICAL_SPEC.md`, контекст проекта — в `claude-context.md` (создай оба файла первым делом из содержимого, которое я предоставлю отдельно, либо ориентируйся на спецификацию ниже).

**Приоритет: качество и завершённость реализации важнее скорости.** Это не прототип-скелет — нужна максимально близкая к production версия: с обработкой ошибок, loading/empty/error состояниями на каждом экране, валидацией, продуманным UX и НЕ шаблонным дизайном (кастомная цветовая палитра, типографика, плавные transitions — не дефолтный вид React Native компонентов).

## Структура репозитория

Создай monorepo (без сложных tooling типа Nx/Turborepo — просто два независимых проекта рядом):

```
trailquest/
├── backend/
├── mobile/
└── docs/
```

## Часть 1 — Backend

**Стек:** Node.js + Express + TypeScript + PostgreSQL + Prisma + JWT + Zod

1. Инициализируй проект (`npm init`, TS config strict mode, ts-node-dev для разработки)
2. Подними Prisma schema по моделям из `TECHNICAL_SPEC.md` (User, Route, Checkpoint, RouteTip, ForumPost, ForumComment, UserRouteProgress) — используй enum'ы как описаны
3. Реализуй все endpoints из секции "API Endpoints" спецификации:
   - Auth (register/login с bcrypt хешированием паролей, JWT с разумным TTL + refresh-логикой)
   - Routes CRUD (GET публичный, остальное — middleware проверки role=ADMIN)
   - Checkpoints, Tips — аналогично
   - Progress endpoints (start/log/checkpoint-reached/complete)
   - Forum (posts/comments)
4. Middleware: централизованная обработка ошибок (единый формат error response), валидация через Zod schemas на каждый endpoint, auth middleware (JWT verify)
5. Утилита Haversine-дистанции в `utils/geo.ts` (понадобится для server-side проверок и для расчёта общей дистанции/скорости при сохранении pathLog)
6. Сидинг: создай seed-скрипт (`prisma/seed.ts`) с 3-4 тестовыми маршрутами (на реальных координатах, можешь взять интересные пешеходные локации), по 3-5 чекпоинтов каждый, парой tips
7. `.env.example` с переменными (DATABASE_URL, JWT_SECRET, PORT)
8. README с инструкцией запуска

## Часть 2 — Mobile App

**Стек:** React Native (bare CLI, **не Expo**) + TypeScript + `@rnmapbox/maps` + `react-native-background-geolocation` + React Navigation + Zustand + React Query

1. Инициализируй bare RN CLI проект с TypeScript template
2. Настрой `@rnmapbox/maps` (потребуется Mapbox access token — оставь placeholder в `.env`, задокументируй где его взять)
3. Navigation: bottom tabs (Explore / Forum / Profile) + stack navigation внутри Explore (Route Detail → Active Navigation)
4. Экраны (детали в `TECHNICAL_SPEC.md` секция 4):
   - **Auth**: Login/Register формы с валидацией, хранение JWT в Keychain/Keystore (react-native-keychain), auto-login при наличии валидного токена
   - **Explore**: карта с кастомным Mapbox-стилем, маркеры маршрутов с кластеризацией, нижний sheet со списком + фильтрами (категория/сложность)
   - **Route Detail**: карточка с описанием, дистанцией, временем, секция "Советы и предупреждения" (визуально отделить WARNING от ADVICE — разные иконки/цвета), кнопка "Начать маршрут"
   - **Active Navigation**: live-карта с текущей позицией (синий dot + heading), верхняя панель: скорость км/ч, пройденная дистанция, прогресс-бар по маршруту, ETA. Background geolocation должен продолжать трекинг при свёрнутом приложении
   - **Checkpoint modal**: triggers автоматически при входе в радиус (используй Haversine из расстояния между текущей позицией и координатами чекпоинта, проверяй на каждое обновление позиции), плюс возможность открыть вручную тапом по метке на карте. Разный визуальный стиль для HISTORICAL/DANGER/UPCOMING/INFO
   - **Forum**: список постов по маршруту, создание поста, тред комментариев
   - **Profile**: список пройденных маршрутов со статистикой (дистанция, время, дата), logout
5. State management: Zustand для auth/session state, React Query для всех серверных данных (routes, posts) с кешированием и optimistic updates на создание поста/комментария
6. Локальные push-уведомления (`@notifee/react-native` или `react-native-push-notification`) для срабатывания чекпоинта, когда приложение в фоне
7. Обработка permissions: location (foreground + background отдельно, с понятным UI объяснением зачем нужно), notifications
8. Дизайн-система: создай `src/theme/` с палитрой, типографикой, spacing-константами — используй во всех компонентах консистентно. Не используй дефолтные React Native Button/TextInput без стилизации
9. README с инструкцией запуска (iOS + Android), включая шаги по `pod install`, Mapbox token setup

## Порядок выполнения

1. Backend полностью (schema → seed → все endpoints → проверка через curl/Postman)
2. Mobile: scaffold + navigation + theme
3. Mobile: Auth flow
4. Mobile: Explore + Route Detail (статичные данные с backend, без трекинга)
5. Mobile: Active Navigation + геотриггеры + background tracking
6. Mobile: Forum
7. Mobile: Profile
8. Финальный проход: error states, loading states, edge cases (нет интернета, нет GPS, пустые списки)

## Явно НЕ делать в этой сборке
- AR/камера-оверлеи
- QR-сканирование
- Admin panel (UI) — управление данными через Prisma Studio
- Модерацию форума
- Offline-карты (можно оставить TODO-комментарий в коде, где это будет подключаться)

## Definition of Done
Полностью рабочее приложение: можно зарегистрироваться, увидеть маршруты на карте, открыть детали, начать маршрут, увидеть live-трекинг с реальным GPS, получить уведомление при входе в радиус чекпоинта, посмотреть/оставить пост в форуме. Backend разворачивается локально одной командой после `npm install` + `npx prisma migrate dev` + `npx prisma db seed`.
