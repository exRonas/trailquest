-- AlterTable
ALTER TABLE "checkpoints" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "route_tips" DROP COLUMN "text";

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "description",
DROP COLUMN "title";
