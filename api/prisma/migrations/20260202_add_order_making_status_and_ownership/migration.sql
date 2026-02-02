-- AlterEnum
ALTER TABLE `Order` MODIFY `status` ENUM('created', 'paid', 'making', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'created';

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `claimedAt` DATETIME(3) NULL;
ALTER TABLE `Order` ADD COLUMN `claimedBy` VARCHAR(191) NULL;
