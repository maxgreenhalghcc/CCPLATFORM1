-- Add unique constraints to enforce idempotent payment flows
ALTER TABLE `Order`
  ADD UNIQUE INDEX `Order_stripeSessionId_key` (`stripeSessionId`);

ALTER TABLE `Payment`
  ADD UNIQUE INDEX `Payment_intentId_key` (`intentId`);
