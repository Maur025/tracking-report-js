import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDirectoryFromResourcePath } from "../common/create-directory-from-resource-path.js";
import path from "node:path";
import { relations } from "./relation.js";

/**
 * @param {object} request
 * @param {import('../../config/environment.js').EnvironmentConfig} request.environment
 */
export const dbProvider = ({ environment }) => {
	createDirectoryFromResourcePath({ resourcePath: environment.DB_URL });

	const dbClient = drizzle({
		connection: {
			url: `file:${environment.DB_URL}`,
		},
		relations,
	});

	const migrateDb = async () => {
		await migrate(dbClient, {
			migrationsFolder: path.resolve(process.cwd(), "./drizzle"),
		});
	};

	return { dbClient, migrateDb };
};
