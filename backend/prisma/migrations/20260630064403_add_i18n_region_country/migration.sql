-- DropIndex
DROP INDEX "routes_country_idx";

-- DropIndex
DROP INDEX "routes_region_idx";

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "countryEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "countryKk" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "countryRu" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "regionEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "regionKk" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "regionRu" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "region" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "country" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "routes_countryEn_idx" ON "routes"("countryEn");
