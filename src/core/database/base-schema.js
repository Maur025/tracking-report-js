import { integer, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export const baseSchema = {
	id: text("id")
		.primaryKey()
		.$default(() => uuidv4()),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	createdBy: text("created_by").$default(() => "system"),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedBy: text("updated_by").$default(() => "system"),
};
