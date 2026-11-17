-- Add version column to settings for settings_history tracing
ALTER TABLE "settings" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
