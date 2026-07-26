import { dbRepository } from "../../core/database/db-repository.js";
import { enterpriseSchema } from "./enterprise.schema.js";

/**
 * @param {object} request
 * @param {import('drizzle-orm/libsql').LibSQLDatabase} request.dbClient
 */
export const enterpriseRepository = ({ dbClient }) => {
	const TABLE_NAME = "enterpriseSchema";

	return {
		...dbRepository({
			dbClient,
			table: enterpriseSchema,
			tableName: TABLE_NAME,
		}),
	};
};
