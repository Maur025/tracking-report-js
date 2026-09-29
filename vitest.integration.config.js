import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({
	path: ".env.test",
});

export default defineConfig({
	test: {
		environment: "node",
		globals: false,

		include: ["test/integration/**/*.test.js"],

		setupFiles: ["./test/setup/integration.setup.js"],
	},
});
