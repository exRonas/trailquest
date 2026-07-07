-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "country" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "user_route_progress" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "routes_country_idx" ON "routes"("country");
