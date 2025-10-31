CREATE TABLE `branches` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`name` text NOT NULL,
	`code` text NOT NULL,
	`address` text NOT NULL,
	`phone` text,
	`email` text,
	`manager` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`client_code` text NOT NULL,
	`pan_number` text,
	`aadhar_number` text,
	`date_of_birth` timestamp,
	`address` text,
	`nominee_details` text,
	`bank_details` text,
	`kyc_status` text DEFAULT ('pending'),
	`total_investment` decimal(15,2) DEFAULT '0',
	`current_value` decimal(15,2) DEFAULT '0',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_client_code_unique` UNIQUE(`client_code`)
);
--> statement-breakpoint
CREATE TABLE `mst_role` (
	`role_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL,
	`created_by_id` int NOT NULL,
	`created_by_user` varchar(50) NOT NULL,
	`created_date` timestamp NOT NULL,
	`modified_by_id` int,
	`modified_by_user` varchar(50),
	`modified_date` timestamp,
	`deleted_by_id` int,
	`deleted_by_user` varchar(50),
	`deleted_date` timestamp,
	CONSTRAINT `mst_role_role_id` PRIMARY KEY(`role_id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`client_id` varchar(36) NOT NULL,
	`instrument_type` text NOT NULL,
	`instrument_name` text NOT NULL,
	`quantity` decimal(15,4),
	`purchase_price` decimal(15,2) NOT NULL,
	`current_price` decimal(15,2),
	`total_invested` decimal(15,2) NOT NULL,
	`current_value` decimal(15,2),
	`gain_loss` decimal(15,2),
	`gain_loss_percentage` decimal(5,2),
	`purchase_date` timestamp NOT NULL,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`client_id` varchar(36) NOT NULL,
	`type` text NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`method` text NOT NULL,
	`status` text NOT NULL DEFAULT ('pending'),
	`description` text,
	`reference_number` text,
	`processed_by` varchar(36),
	`processed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`email` text NOT NULL,
	`mobile` text,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`branch_id` varchar(36),
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_mobile_unique` UNIQUE(`mobile`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_processed_by_users_id_fk` FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_branch_id_branches_id_fk` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE no action ON UPDATE no action;