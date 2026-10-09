CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`section` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classes_name_unique` ON `classes` (`name`);--> statement-breakpoint
CREATE TABLE `match_events` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`side` text NOT NULL,
	`type` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`sport_id` text NOT NULL,
	`home_class_id` text NOT NULL,
	`away_class_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`venue` text NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`home_score` integer DEFAULT 0 NOT NULL,
	`away_score` integer DEFAULT 0 NOT NULL,
	`referee_id` text,
	`period` integer DEFAULT 1 NOT NULL,
	`clock_seconds` integer DEFAULT 0 NOT NULL,
	`clock_running` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`home_class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sports` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`score_label` text DEFAULT 'Gol' NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`class_id` text,
	`role` text DEFAULT 'STUDENT' NOT NULL,
	`avatar` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);