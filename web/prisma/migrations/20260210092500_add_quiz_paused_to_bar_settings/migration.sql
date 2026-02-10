-- AlterTable
-- Add quizPaused column to BarSettings (busy-night mode feature)
-- Default value: false (quiz is active by default)
-- This is an additive-only migration - no data loss
ALTER TABLE `BarSettings` ADD COLUMN `quizPaused` BOOLEAN NOT NULL DEFAULT false;
