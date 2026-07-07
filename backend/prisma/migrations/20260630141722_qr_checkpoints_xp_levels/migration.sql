-- CreateTable
CREATE TABLE "checkpoint_scans" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoint_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_country_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_country_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkpoint_scans_progressId_idx" ON "checkpoint_scans"("progressId");

-- CreateIndex
CREATE INDEX "checkpoint_scans_checkpointId_idx" ON "checkpoint_scans"("checkpointId");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_scans_progressId_checkpointId_key" ON "checkpoint_scans"("progressId", "checkpointId");

-- CreateIndex
CREATE INDEX "user_country_progress_userId_idx" ON "user_country_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_country_progress_userId_country_key" ON "user_country_progress"("userId", "country");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_qrCode_key" ON "checkpoints"("qrCode");

-- AddForeignKey
ALTER TABLE "checkpoint_scans" ADD CONSTRAINT "checkpoint_scans_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "user_route_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_scans" ADD CONSTRAINT "checkpoint_scans_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_country_progress" ADD CONSTRAINT "user_country_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
