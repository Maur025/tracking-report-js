import "dotenv/config";
import { logger } from "./core/common/logger.js";
import { iocContainer } from "./config/ioc/ioc-container.js";
import { socketClientHandler } from "./core/socket-client/socket-client-handler.js";
import { dbProvider } from "./core/database/db-provider.js";
import { enterpriseConfigDbRepository } from "./modules/enterprise/enterprise-config-db.repository.js";

async function bootstrap() {
	const environment = iocContainer.resolve("environment");
	/** @type {import('./config/ioc/container-adapter.js').ContainerAdapter} */
	const containerAdapter = iocContainer.resolve("containerAdapter");

	const { dbClient, migrateDb } = dbProvider({ environment });

	containerAdapter.registerValue("dbClient", dbClient);

	/**
	 * @type {import('./core/server-app.js').ServerApp}
	 */
	const serverApp = iocContainer.resolve("serverApp");

	const {
		scheduler,
		wsClientGateway,
		wsServerOutput,
		setupOutput,
		setupGatewayClient,
		setupScheduler,
	} = await socketClientHandler({
		environment,
		dbClient,
		enterpriseConfigDbRepository,
	});

	try {
		await migrateDb();
		await serverApp.initialize();
		await scheduler.start();
		await setupScheduler();

		await wsClientGateway.start();
		await setupGatewayClient();

		await wsServerOutput.start();
		await setupOutput();
		await serverApp.listen();
	} catch (error) {
		logger.error(`[APP] Error during initialization:`, error);
		process.exit(1);
	}
}

bootstrap();
