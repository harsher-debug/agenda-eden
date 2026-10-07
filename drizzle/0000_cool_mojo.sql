CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar` text NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`kind` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`calendar`) REFERENCES `calendars`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_calendar_date` ON `bookings` (`calendar`,`date`);--> statement-breakpoint
CREATE TABLE `calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`service` text NOT NULL,
	`duration` integer NOT NULL,
	`hours` text NOT NULL,
	`location` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendars_owner_unique` ON `calendars` (`owner`);--> statement-breakpoint
CREATE TABLE `slot_locks` (
	`calendar` text NOT NULL,
	`date` text NOT NULL,
	`minute` integer NOT NULL,
	`booking` text NOT NULL,
	FOREIGN KEY (`booking`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_slot_locks_unique` ON `slot_locks` (`calendar`,`date`,`minute`);