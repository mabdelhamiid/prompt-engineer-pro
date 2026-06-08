CREATE TABLE `promptHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('generation','improvement') NOT NULL,
	`inputText` text NOT NULL,
	`outputPrompt` text NOT NULL,
	`framework` varchar(64) NOT NULL,
	`improvementBreakdown` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promptHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedPrompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`tags` varchar(500),
	`framework` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedPrompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `promptHistory` ADD CONSTRAINT `promptHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedPrompts` ADD CONSTRAINT `savedPrompts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;