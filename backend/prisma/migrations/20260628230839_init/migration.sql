-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RouteCategory" AS ENUM ('HISTORICAL', 'BATTLE', 'SCENIC', 'GATHERING_SPOT', 'MIXED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('HISTORICAL', 'DANGER', 'UPCOMING', 'INFO');

-- CreateEnum
CREATE TYPE "TipType" AS ENUM ('WARNING', 'ADVICE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RouteCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "pathPoints" JSONB NOT NULL,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CheckpointType" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "altitudeM" DOUBLE PRECISION,
    "radiusTriggerM" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "qrCode" TEXT,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_tips" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "checkpointId" TEXT,
    "type" "TipType" NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "route_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_route_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastCheckpointIndex" INTEGER NOT NULL DEFAULT 0,
    "totalDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movingSeconds" INTEGER NOT NULL DEFAULT 0,
    "pathLog" JSONB NOT NULL,

    CONSTRAINT "user_route_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "routes_category_idx" ON "routes"("category");

-- CreateIndex
CREATE INDEX "routes_difficulty_idx" ON "routes"("difficulty");

-- CreateIndex
CREATE INDEX "routes_region_idx" ON "routes"("region");

-- CreateIndex
CREATE INDEX "checkpoints_routeId_idx" ON "checkpoints"("routeId");

-- CreateIndex
CREATE INDEX "route_tips_routeId_idx" ON "route_tips"("routeId");

-- CreateIndex
CREATE INDEX "route_tips_checkpointId_idx" ON "route_tips"("checkpointId");

-- CreateIndex
CREATE INDEX "forum_posts_routeId_idx" ON "forum_posts"("routeId");

-- CreateIndex
CREATE INDEX "forum_posts_userId_idx" ON "forum_posts"("userId");

-- CreateIndex
CREATE INDEX "forum_comments_postId_idx" ON "forum_comments"("postId");

-- CreateIndex
CREATE INDEX "forum_comments_userId_idx" ON "forum_comments"("userId");

-- CreateIndex
CREATE INDEX "user_route_progress_userId_idx" ON "user_route_progress"("userId");

-- CreateIndex
CREATE INDEX "user_route_progress_routeId_idx" ON "user_route_progress"("routeId");

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_tips" ADD CONSTRAINT "route_tips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_tips" ADD CONSTRAINT "route_tips_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_route_progress" ADD CONSTRAINT "user_route_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_route_progress" ADD CONSTRAINT "user_route_progress_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
