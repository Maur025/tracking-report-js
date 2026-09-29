import "dotenv/config";
import { iocContainer } from "./config/ioc/ioc-container.js";
import { logger } from "./core/common/logger.js";

async function bootstrap() {
	/** @type {import('./config/ioc/container-adapter.js').ContainerAdapter} */
	const containerAdapter = iocContainer.resolve("containerAdapter");

	/** @type {ReturnType<typeof import("./core/database/db-provider.js").dbProvider} */
	const { dbClient, migrateDb } = containerAdapter.resolve("dbProvider");

	containerAdapter.registerValue("dbClient", dbClient);

	/** @type {import('./core/server-app.js').ServerApp} */
	const serverApp = containerAdapter.resolve("serverApp");

	/** @type {ReturnType<typeof import('./core/socket-client/socket-client-handler.js').socketClientHandler>} */
	const {
		scheduler,
		wsClientGateway,
		wsServerOutput,
		setupOutput,
		setupGatewayClient,
		setupScheduler,
	} = containerAdapter.resolve("socketClientHandler");

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
