-- Added to enrich bar settings with business and branding metadata.
ALTER TABLE `BarSettings`
  ADD COLUMN `contactName` VARCHAR(191) NULL,
  ADD COLUMN `contactEmail` VARCHAR(191) NULL,
  ADD COLUMN `contactPhone` VARCHAR(191) NULL,
  ADD COLUMN `address` JSON NULL,
  ADD COLUMN `openingHours` JSON NULL,
  ADD COLUMN `stock` JSON NULL,
  ADD COLUMN `stockListUrl` VARCHAR(191) NULL,
  ADD COLUMN `bankDetails` JSON NULL,
  ADD COLUMN `stripeConnectId` VARCHAR(191) NULL,
  ADD COLUMN `stripeConnectLink` VARCHAR(191) NULL,
  ADD COLUMN `brandPalette` JSON NULL,
  ADD COLUMN `logoUrl` VARCHAR(191) NULL;
