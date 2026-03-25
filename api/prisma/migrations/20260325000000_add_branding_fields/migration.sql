-- Adds preset, fontFamily, and logoLockupMode to BarSettings for the brand studio.
ALTER TABLE `BarSettings`
  ADD COLUMN `preset` VARCHAR(191) NULL,
  ADD COLUMN `fontFamily` VARCHAR(191) NULL,
  ADD COLUMN `logoLockupMode` VARCHAR(191) NULL;
