import compression from "compression";
import cors from "cors";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

/**
 * @typedef {object} ControllerInterface
 * @property {function} registerRoutes
 */

export class ServerApp {
	#express;
	#environment;
	#controllers;
	#errorHandler;
	#containerAdapter;

	/** @type { import('express').Application|null} */
	#expressApp = null;

	/**
	 * @param {object} dep
	 * @param {import('../config/environment.js').EnvironmentConfig} dep.environment
	 * @param {ControllerInterface[]} dep.controllers
	 * @param {typeof import('express')} dep.express
	 * @param {import('./error-handler.js').ErrorHandler} dep.errorHandler
	 * @param {import('../config/ioc/container-adapter.js').ContainerAdapter} dep.containerAdapter
	 */
	constructor({ environment, controllers, express, errorHandler, containerAdapter }) {
		this.#express = express;
		this.#environment = environment;
		this.#controllers = controllers;
		this.#errorHandler = errorHandler;
		this.#containerAdapter = containerAdapter;
	}

	initialize() {
		this.#expressApp = this.#express();

		this.#expressApp.use(compression());
		this.#expressApp.use(
			cors({
				origin: "*",
				methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		);
		this.#expressApp.use(this.#express.json({ limit: "25mb" }));
		this.#expressApp.use(this.#express.text({ limit: "25mb" }));
		this.#expressApp.use(
			this.#express.urlencoded({
				extended: true,
				parameterLimit: 100_000,
				limit: "25mb",
			}),
		);
		this.#expressApp.use("/", this.#express.static(this.#environment.APP_STATIC_PUBLIC_PATH));

		this.#controllers.forEach((controller) => {
			if (typeof controller.registerRoutes === "function") {
				controller.registerRoutes(this.#expressApp, "/api");
			}
		});

		// eslint-disable-next-line no-unused-vars
		this.#expressApp.use((req, res, next) => {
			res.status(StatusCodes.NOT_FOUND).json({
				code: StatusCodes.NOT_FOUND,
				message: ReasonPhrases.NOT_FOUND,
			});
		});

		this.#expressApp.use((err, req, res, next) =>
			this.#errorHandler.handler(err, req, res, next),
		);

		this.#containerAdapter.registerValue("expressApp", this.#expressApp);
	}

	getApp() {
		return this.#expressApp;
	}

	listen() {
		if (!this.#expressApp) {
			console.error(
				"[SERVER] Express app is not initialized. Call initialize() before listen().",
			);
			return;
		}

		this.#expressApp.listen(this.#environment.APP_PORT, () => {
			console.info(`[SERVER] Server is running on port ${this.#environment.APP_PORT}`);
		});
	}
}
