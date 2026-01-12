-- AlterTable
ALTER TABLE `Bar` DROP COLUMN `staffPinHash`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `contact`,
    ADD COLUMN `customerRating` INTEGER NULL,
    ADD COLUMN `ratingComment` VARCHAR(191) NULL,
    ADD COLUMN `ratingFlagged` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `staffPinHash`;

