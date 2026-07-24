CREATE TABLE `enterprises` (
	`id` text PRIMARY KEY,
	`created_at` integer,
	`created_by` text,
	`updated_at` integer,
	`updated_by` text,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`image` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_enterprise_config_dbs` (
	`id` text PRIMARY KEY,
	`created_at` integer,
	`created_by` text,
	`updated_at` integer,
	`updated_by` text,
	`host` text NOT NULL,
	`port` text NOT NULL,
	`database` text NOT NULL,
	`reference_id` text NOT NULL,
	`enterprise_ref_id` text NOT NULL,
	CONSTRAINT `fk_enterprise_config_dbs_enterprise_ref_id_enterprises_id_fk` FOREIGN KEY (`enterprise_ref_id`) REFERENCES `enterprises`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_enterprise_config_dbs`(`id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `host`, `port`, `database`, `reference_id`, `enterprise_ref_id`) SELECT `id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `host`, `port`, `database`, `reference_id`, `enterprise_ref_id` FROM `enterprise_config_dbs`;--> statement-breakpoint
DROP TABLE `enterprise_config_dbs`;--> statement-breakpoint
ALTER TABLE `__new_enterprise_config_dbs` RENAME TO `enterprise_config_dbs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `enterprise_config_dbs_reference,db,enterprise_id_unique` ON `enterprise_config_dbs` (`database`,`reference_id`,`enterprise_ref_id`);