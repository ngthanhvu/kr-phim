ALTER TABLE `users` ADD `reset_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token_expires` timestamp;