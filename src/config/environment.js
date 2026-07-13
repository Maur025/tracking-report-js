const {
	APP_PORT = 7769,
	APP_STATIC_PUBLIC_PATH = "./public",
	APP_ID,
	APP_NAME,
	TZ,
	WS_GATEWAY_HOST_PROCESSOR,
	WS_GATEWAY_PORT_PROCESSOR,
	UUID,
	PING_INTERVAL_MS,
	STORAGE_INTERVAL_HRS,
	SAVE_INTERVAL_MIN,
	WS_PORT,
	DB_URL = "./database/tracking-report.db",
} = process.env;

/**
 * @typedef {object} EnvironmentConfig
 * @property {number} APP_PORT - The port number on which the application will run.
 * @property {string} APP_STATIC_PUBLIC_PATH - The path to the static public directory for serving static files.
 */

/** @type {EnvironmentConfig} */
export const environment = {
	APP_PORT: Number(APP_PORT),
	APP_STATIC_PUBLIC_PATH,

	APP_ID,
	APP_NAME,
	TZ,
	WS_GATEWAY_HOST_PROCESSOR,
	WS_GATEWAY_PORT_PROCESSOR,
	UUID,

	PING_INTERVAL_MS: Number(PING_INTERVAL_MS),
	STORAGE_INTERVAL_HRS: Number(STORAGE_INTERVAL_HRS),
	SAVE_INTERVAL_MIN: Number(SAVE_INTERVAL_MIN),

	WS_PORT: Number(WS_PORT),
	DB_URL,
};
