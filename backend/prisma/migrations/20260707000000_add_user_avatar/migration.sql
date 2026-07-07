-- Preset avatar id chosen by the user (e.g. "panda-0"); null = initials fallback.
ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
