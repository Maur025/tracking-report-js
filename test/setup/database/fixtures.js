import { sql } from "drizzle-orm";
import { iocContainer } from "../../../src/config/ioc/ioc-container.js";

export const cleanDatabase = async () => {
	/** @type {import('drizzle-orm/libsql').LibSQLDatabase} */
	const dbClient = iocContainer.resolve("dbClient");

	const tableNames = ["enterprise_config_dbs", "enterprises"];

	for (const name of tableNames) {
		await dbClient.run(sql.raw(`DELETE FROM ${name}`));
	}
};
