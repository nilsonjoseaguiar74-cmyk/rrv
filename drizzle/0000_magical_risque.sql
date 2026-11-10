CREATE TABLE `lead_rate_limits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`project_type` text NOT NULL,
	`description` text NOT NULL,
	`problem` text NOT NULL,
	`budget` text NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`utm_source` text DEFAULT '' NOT NULL,
	`utm_medium` text DEFAULT '' NOT NULL,
	`utm_campaign` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
