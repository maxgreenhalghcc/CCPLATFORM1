ALTER TABLE `BarSettings`
  CHANGE COLUMN `pricingCents` `pricingPounds` DECIMAL(10, 2) NOT NULL DEFAULT 12.00;

UPDATE `BarSettings`
SET `pricingPounds` = `pricingPounds` / 100;

ALTER TABLE `Order`
  CHANGE COLUMN `amountCents` `amount` DECIMAL(10, 2) NOT NULL,
  CHANGE COLUMN `currency` `currency` VARCHAR(191) NOT NULL DEFAULT 'gbp';

UPDATE `Order`
SET `amount` = `amount` / 100;

ALTER TABLE `Payment`
  CHANGE COLUMN `amountCents` `amount` DECIMAL(10, 2) NOT NULL;

UPDATE `Payment`
SET `amount` = `amount` / 100;
