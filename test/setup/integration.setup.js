import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServer } from "./msw/msw-server.js";

beforeAll(() => {
	mswServer.listen({
		onUnhandledFrame: "warn",
	});
});

afterEach(() => {
	mswServer.resetHandlers();
});

afterAll(() => {
	mswServer.close();
});
