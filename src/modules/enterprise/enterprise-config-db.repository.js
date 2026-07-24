import { dbRepository } from "../../core/database/db-repository.js";
import { enterpriseConfigDbSchema } from "./enterprise-config-db.schema.js";

/**
 * @param {object} request
 * @param {import('drizzle-orm/libsql').LibSQLDatabase} request.dbClient
 */
export const enterpriseConfigDbRepository = ({ dbClient }) => {
	const TABLE_NAME = "enterpriseConfigDbSchema";

	const dbRepositoryInstance = dbRepository({
		dbClient,
		table: enterpriseConfigDbSchema,
		tableName: TABLE_NAME,
		withData: {
			enterprise: true,
		},
	});

	const config = dbRepositoryInstance.getConfigWithData();

	const findByDatabase = async ({ database }) => {
		return dbClient.query[TABLE_NAME].findFirst({
			...config,
			where: {
				database,
			},
		});
	};

	return {
		...dbRepositoryInstance,
		findByDatabase,
	};
};
