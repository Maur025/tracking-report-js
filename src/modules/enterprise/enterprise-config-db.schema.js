import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { baseSchema } from "../../core/database/base-schema.js";
import { enterpriseSchema } from "./enterprise.schema.js";

export const enterpriseConfigDbSchema = sqliteTable(
	"enterprise_config_dbs",
	{
		...baseSchema,
		host: text("host").notNull(),
		port: text("port").notNull(),
		database: text("database").notNull(),
		referenceId: text("reference_id").notNull(),
		enterpriseRefId: text("enterprise_ref_id")
			.notNull()
			.references(() => enterpriseSchema.id),
	},
	(table) => [
		uniqueIndex("enterprise_config_dbs_reference,db,enterprise_id_unique").on(
			table.database,
			table.referenceId,
			table.enterpriseRefId,
		),
	],
);
