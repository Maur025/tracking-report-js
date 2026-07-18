import { dbRepository } from "../../core/database/db-repository.js";
import { enterpriseConfigDbSchema } from "./enterprise-config-db.schema.js";

/**
 * @param {object} request
 * @param {import('drizzle-orm/libsql').LibSQLDatabase} request.dbClient
 */
export const enterpriseConfigDbRepository = ({ dbClient }) => {
	return {
		...dbRepository({
			dbClient,
			table: enterpriseConfigDbSchema,
			tableName: "enterpriseConfigDb",
		}),
	};
};
