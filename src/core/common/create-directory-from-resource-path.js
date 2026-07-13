import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";

/**
 * @param {object} request
 * @param {string} request.resourcePath
 */
export const createDirectoryFromResourcePath = ({ resourcePath }) => {
	if (!resourcePath) {
		logger.error("Resource path is not provided.");
		return;
	}

	const absolutePath = path.resolve(process.cwd(), resourcePath);
	const directory = path.dirname(absolutePath);

	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}
};
