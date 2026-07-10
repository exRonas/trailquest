# TrailQuest — Technical Specification

> **Статус:** это исходная концептуальная спецификация (Phase 1 MVP), написанная
> до старта разработки. Часть решений с тех пор изменилась на практике — самое
> важное: чекпоинты отмечаются **сканированием QR-кода**, а не гео-триггером
> (см. `docs/ADMIN_WEB_PROGRESS.md`, Round 7), текстовые поля (title/description/
> region/country и т.д.) хранятся **по языкам** (`{ru, en, kk}`, Round 5), и
> **админ-панель построена** (не Prisma Studio, см. Round 3+). Актуальное,
> полное состояние проекта по раундам — в `docs/ADMIN_WEB_PROGRESS.md`; этот
> файл оставлен как исторический концепт-документ и ориентир по исходной модели.

## 1. Концепция

Мобильное приложение с картой пеших маршрутов (исторические места, места сражений, смотровые точки). Пользователь выбирает маршрут, проходит его с live-навигацией (как в обычных картах — скорость/дистанция/прогресс), на пути срабатывают гео-чекпоинты с описаниями (история / опасность / анонс). Отдельный форум для советов по маршрутам. AR-слой (камера + оверлеи на реальных точках) — Phase 2, не входит в текущую сборку, но модель данных проектируется с расчётом на него.

## 2. Data Models (Prisma schema, концептуально)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  posts         ForumPost[]
  comments      ForumComment[]
  progress      UserRouteProgress[]
}

enum Role {
  USER
  ADMIN
}

model Route {
  id              String    @id @default(uuid())
  title           String
  description     String
  category        RouteCategory   // HISTORICAL, BATTLE, SCENIC, MIXED
  difficulty       Difficulty      // EASY, MODERATE, HARD
  distanceKm       Float
  estimatedMinutes Int
  region           String
  // Полилиния маршрута — массив точек в порядке прохождения
  pathPoints       Json      // [{ lat, lng, altitudeM, sequence }]
  coverImageUrl    String?
  createdAt        DateTime  @default(now())
  checkpoints      Checkpoint[]
  tips             RouteTip[]
  posts            ForumPost[]
  progress         UserRouteProgress[]
}

enum RouteCategory {
  HISTORICAL
  BATTLE
  SCENIC
  GATHERING_SPOT
  MIXED
}

enum Difficulty {
  EASY
  MODERATE
  HARD
}

model Checkpoint {
  id              String   @id @default(uuid())
  routeId         String
  route           Route    @relation(fields: [routeId], references: [id])
  name            String
  type            CheckpointType   // HISTORICAL, DANGER, UPCOMING, INFO
  lat             Float
  lng             Float
  altitudeM       Float?           // задел под AR (Phase 2)
  radiusTriggerM  Int      @default(30)
  description     String
  mediaUrl        String?
  qrCode          String?          // задел под AR/QR (Phase 2)
  orderIndex      Int
}

enum CheckpointType {
  HISTORICAL
  DANGER
  UPCOMING
  INFO
}

model RouteTip {
  id            String   @id @default(uuid())
  routeId       String
  route         Route    @relation(fields: [routeId], references: [id])
  checkpointId  String?  // null = относится ко всему маршруту
  type          TipType  // WARNING, ADVICE
  text          String
}

enum TipType {
  WARNING
  ADVICE
}

model ForumPost {
  id        String   @id @default(uuid())
  routeId   String
  route     Route    @relation(fields: [routeId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  body      String
  createdAt DateTime @default(now())
  comments  ForumComment[]
}

model ForumComment {
  id        String   @id @default(uuid())
  postId    String
  post      ForumPost @relation(fields: [postId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  body      String
  createdAt DateTime @default(now())
}

model UserRouteProgress {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  routeId             String
  route               Route     @relation(fields: [routeId], references: [id])
  startedAt           DateTime  @default(now())
  completedAt         DateTime?
  lastCheckpointIndex Int       @default(0)
  pathLog             Json      // [{ lat, lng, speedKmh, timestamp }] — для расчёта скорости/дистанции
}
```

## 3. API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Routes
- `GET /api/routes?category=&difficulty=&region=` — список с фильтрами
- `GET /api/routes/:id` — полная детализация (pathPoints, checkpoints, tips)
- `POST /api/routes` — admin only
- `PATCH /api/routes/:id` — admin only
- `DELETE /api/routes/:id` — admin only

### Checkpoints
- `GET /api/routes/:routeId/checkpoints`
- `POST /api/checkpoints` — admin only
- `PATCH /api/checkpoints/:id` — admin only

### Tips
- `GET /api/routes/:routeId/tips`
- `POST /api/tips` — admin only

### Progress / Navigation
- `POST /api/routes/:id/start` — создаёт UserRouteProgress
- `PATCH /api/progress/:id/log` — добавляет точку в pathLog (батчинг точек GPS)
- `PATCH /api/progress/:id/checkpoint-reached` — фиксирует прохождение чекпоинта
- `PATCH /api/progress/:id/complete`

### Forum
- `GET /api/routes/:routeId/posts`
- `POST /api/routes/:routeId/posts`
- `GET /api/posts/:id/comments`
- `POST /api/posts/:id/comments`

## 4. Mobile Screens

| Экран | Назначение |
|---|---|
| **Auth** (Login/Register) | Вход/регистрация |
| **Explore** | Карта со всеми маршрутами (кластеризация пинов), фильтр по категории/сложности |
| **Route Detail** | Описание, дистанция, время, список советов/предупреждений, кнопка "Начать маршрут" |
| **Active Navigation** | Live-карта: текущая позиция, скорость, пройденная дистанция, прогресс-бар, ETA. Модалка при срабатывании чекпоинта |
| **Checkpoint Detail** (modal) | Текст справки/предупреждения, фото, можно открыть вручную тапом по метке на карте |
| **Forum** | Список маршрутов → посты → комментарии |
| **Profile** | Пройденные маршруты, статистика, настройки |

## 5. Ключевые технические решения

- **Гео-триггер чекпоинтов**: на клиенте, через Haversine-дистанцию между текущей позицией (из background geolocation) и координатами чекпоинта; при входе в `radiusTriggerM` — локальное push-уведомление + модалка, если приложение активно
- **Расчёт скорости**: по последним 2-3 точкам `pathLog` (Δdistance / Δtime), сглаживание скользящим средним, чтобы не дёргалось от шума GPS
- **Офлайн**: Mapbox offline tiles для региона маршрута скачиваются при открытии Route Detail (опционально, не блокирует MVP)
- **AR-задел**: `altitudeM` и `qrCode` в Checkpoint, `pathPoints` хранят высоту — этого достаточно, чтобы Phase 2 (ARKit/ARCore geo-anchors) не требовала миграции схемы

## 6. Что НЕ входит в эту сборку (исходный план Phase 1)
- AR-камера и оверлеи — **всё ещё не построено**, единственный пункт отсюда, который
  реально остаётся не сделан
- ~~QR-сканирование~~ — построено (Round 7), стало основным способом отметки чекпоинта
- ~~Admin Panel UI (CRUD через Prisma Studio / Postman)~~ — построена полноценная
  браузерная админка (`admin/`, Round 1-3+)
- ~~Модерация форума~~ — построена (Round 10)
