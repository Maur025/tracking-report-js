import { iocContainer } from "../../src/config/ioc/ioc-container.js";

export async function createTestApp() {
	/** @type {import('../../src/config/ioc/container-adapter.js').ContainerAdapter} */
	const containerAdapter = iocContainer.resolve("containerAdapter");

	/** @type {ReturnType<typeof import("../../src/core/database/db-provider.js").dbProvider>} */
	const { dbClient, migrateDb } = containerAdapter.resolve("dbProvider");

	containerAdapter.registerValue("dbClient", dbClient);

	await migrateDb();

	/** @type {import('../../src/core/server-app.js').ServerApp} */
	const serverApp = containerAdapter.resolve("serverApp");

	await serverApp.initialize();

	return serverApp.getApp();
}
