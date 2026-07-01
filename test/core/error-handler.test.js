import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { ErrorHandler } from "../../src/core/error-handler.js";

describe("ErrorHandler test", () => {
	let errorHandler;

	beforeEach(() => {
		errorHandler = new ErrorHandler();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test("should ", () => {
		// GIVEN

		// WHEN

		// THEN

		expect.fail("Not implemented yet");
	});
});
