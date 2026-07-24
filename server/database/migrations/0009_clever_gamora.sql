CREATE TABLE `comment_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`comment_id` int NOT NULL,
	`vote` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `parent_id` int;--> statement-breakpoint
ALTER TABLE `comments` ADD `like_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `dislike_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_user_comment` ON `comment_votes` (`user_id`,`comment_id`);--> statement-breakpoint
CREATE INDEX `idx_parent_id` ON `comments` (`parent_id`);