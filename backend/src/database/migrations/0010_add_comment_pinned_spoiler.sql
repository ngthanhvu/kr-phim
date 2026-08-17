-- Add pinned and spoiler columns to comments table
ALTER TABLE `comments` ADD COLUMN `pinned` boolean NOT NULL DEFAULT false;
ALTER TABLE `comments` ADD COLUMN `spoiler` boolean NOT NULL DEFAULT false;
