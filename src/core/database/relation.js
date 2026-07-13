import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

// eslint-disable-next-line no-unused-vars
export const relations = defineRelations(schema, (relation) => ({}));
