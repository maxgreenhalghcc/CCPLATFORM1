-- Alter Order status enum and add payment integration fields
ALTER TABLE `Order`
  ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'usd',
  ADD COLUMN `stripeSessionId` VARCHAR(191) NULL;

ALTER TABLE `Order`
  CHANGE `priceCents` `amountCents` INTEGER NOT NULL;

ALTER TABLE `Order`
  ADD COLUMN `status_new` ENUM('created', 'paid', 'cancelled') NOT NULL DEFAULT 'created';

UPDATE `Order`
SET `status_new` = CASE `status`
  WHEN 'pending' THEN 'created'
  WHEN 'fulfilled' THEN 'paid'
  WHEN 'paid' THEN 'paid'
  WHEN 'cancelled' THEN 'cancelled'
  ELSE 'created'
END;

ALTER TABLE `Order`
  DROP COLUMN `status`;

ALTER TABLE `Order`
  CHANGE `status_new` `status` ENUM('created', 'paid', 'cancelled') NOT NULL DEFAULT 'created';

ALTER TABLE `QuizSession`
  ADD COLUMN `answerRecord` JSON NULL;

ALTER TABLE `QuizAnswer`
  ADD CONSTRAINT `QuizAnswer_sessionId_questionId_key` UNIQUE (`sessionId`, `questionId`);
