-- AlterTable
ALTER TABLE `User`
    ADD IF NOT EXISTS COLUMN `emailVerified` DATETIME(3) NULL,
    ADD IF NOT EXISTS COLUMN `image` VARCHAR(191) NULL,
    ADD IF NOT EXISTS COLUMN `name` VARCHAR(191) NULL,
    MODIFY `role` ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` LONGTEXT NULL,
    `access_token` LONGTEXT NULL,
    `expires_at` INT NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` LONGTEXT NULL,
    `session_state` VARCHAR(191) NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`)
);

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`)
);

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
);

-- AddForeignKey
ALTER TABLE `Account`
    MODIFY `userId` VARCHAR(191) NOT NULL;
    ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session`
    ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
