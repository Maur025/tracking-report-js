import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (relation) => ({
	enterpriseConfigDbSchema: {
		enterprise: relation.one.enterpriseSchema({
			from: relation.enterpriseConfigDbSchema.enterpriseRefId,
			to: relation.enterpriseSchema.id,
		}),
	},
}));
