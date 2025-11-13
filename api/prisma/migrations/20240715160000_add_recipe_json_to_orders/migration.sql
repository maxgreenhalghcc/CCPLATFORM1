-- Add recipeJson column to orders for storing generated recipe payloads
ALTER TABLE `Order` ADD COLUMN `recipeJson` JSON NULL;
