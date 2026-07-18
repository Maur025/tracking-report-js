CREATE TABLE `enterprise_config_dbs` (
	`id` text PRIMARY KEY,
	`created_at` integer,
	`created_by` text,
	`updated_at` integer,
	`updated_by` text,
	`host` text NOT NULL,
	`port` text NOT NULL,
	`database` text NOT NULL,
	`reference_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enterprise_config_dbs_reference_id_unique` ON `enterprise_config_dbs` (`database`,`reference_id`);