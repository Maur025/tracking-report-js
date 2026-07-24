import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { baseSchema } from "../../core/database/base-schema.js";

export const enterpriseSchema = sqliteTable("enterprises", {
	...baseSchema,
	name: text("name").notNull(),
	description: text("description"),
	color: text("color"),
	image: text("image"),
});
