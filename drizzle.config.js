import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/core/database/schema.js",
	dialect: "sqlite",
	dbCredentials: {
		url: `file:${process.env.DB_URL}`,
	},
});
