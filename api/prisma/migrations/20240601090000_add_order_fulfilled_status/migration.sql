-- AlterTable
ALTER TABLE `Order`
  ADD COLUMN `fulfilledAt` DATETIME(3) NULL,
  MODIFY `status` ENUM('created', 'paid', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'created';
