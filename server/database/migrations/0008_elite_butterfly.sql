CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT '',
	`slug` varchar(500) NOT NULL,
	`movie_name` varchar(500),
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_source_slug` ON `comments` (`source`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `comments` (`user_id`);