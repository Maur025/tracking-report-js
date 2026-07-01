const { APP_PORT = 7769, APP_STATIC_PUBLIC_PATH = "./public" } = process.env;

/**
 * @typedef {object} EnvironmentConfig
 * @property {number} APP_PORT - The port number on which the application will run.
 * @property {string} APP_STATIC_PUBLIC_PATH - The path to the static public directory for serving static files.
 */

/** @type {EnvironmentConfig} */
export const environment = {
	APP_PORT: Number(APP_PORT),
	APP_STATIC_PUBLIC_PATH,
};
