import { iocContainer } from "./config/ioc/ioc-container.js";

async function bootstrap() {
	/**
	 * @type {import('./core/server-app.js').ServerApp}
	 */
	const serverApp = iocContainer.resolve("serverApp");

	try {
		serverApp.initialize();
		serverApp.listen();
	} catch (error) {
		console.error(`[APP] Error during initialization: ${error.message}`);
		process.exit(1);
	}
}

bootstrap();
