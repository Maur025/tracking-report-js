import { dbRepository } from "../../core/database/db-repository.js";
import { enterpriseConfigDbSchema } from "./enterprise-config-db.schema.js";

/**
 * @param {object} request
 * @param {import('drizzle-orm/libsql').LibSQLDatabase} request.dbClient
 */
export const enterpriseConfigDbRepository = ({ dbClient }) => {
	const TABLE_NAME = "enterpriseConfigDbSchema";

	const findByDatabase = async ({ database }) => {
		return dbClient.query[TABLE_NAME].findFirst({
			where: {
				database,
			},
		});
	};

	return {
		...dbRepository({
			dbClient,
			table: enterpriseConfigDbSchema,
			tableName: "enterpriseConfigDb",
		}),
		findByDatabase,
	};
};
