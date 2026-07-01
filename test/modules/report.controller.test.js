import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { ReportController } from "../../src/modules/report.controller.js";

describe("ReportController test", () => {
	let reportController;

	beforeEach(() => {
		reportController = new ReportController();
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
