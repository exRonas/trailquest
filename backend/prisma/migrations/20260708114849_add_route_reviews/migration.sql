-- CreateTable
CREATE TABLE "route_reviews" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_reviews_routeId_idx" ON "route_reviews"("routeId");

-- CreateIndex
CREATE INDEX "route_reviews_userId_idx" ON "route_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "route_reviews_userId_routeId_key" ON "route_reviews"("userId", "routeId");

-- AddForeignKey
ALTER TABLE "route_reviews" ADD CONSTRAINT "route_reviews_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_reviews" ADD CONSTRAINT "route_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
