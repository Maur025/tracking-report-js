import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { binaryParser } from "../common/utils.js";
import { cleanDatabase } from "../setup/database/fixtures.js";
import { seedEnterpriseConfig } from "../setup/database/seed.js";
import { createTestApp } from "../setup/test-app.js";

const RESOURCE_URL = "/api/reports/events";

describe("GET /api/reports/events", () => {
	let app;

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await cleanDatabase();
		await seedEnterpriseConfig();
	});

	it("should fail with 400 Bad Request when required query parameters are missing", async () => {
		// WHEN
		const response = await request(app).get(RESOURCE_URL).buffer(true);

		// THEN
		expect(response.status).toBe(400);
	});

	describe("Generate event report in pdf format", () => {
		it("should return a valid PDF file given valid request, when generating pdf", async () => {
			// WHEN
			const response = await request(app)
				.get(RESOURCE_URL)
				.query({
					descending: true,
					disposition: "attachment",
					fileName: "event_report",
					databaseName: "enterprise_1_db",
					type: "GEOFENCES",
					sortBy: "date",
					format: "pdf",
					date: "2026-09-29T16:27:17.649Z",
					zoneId: "America/La_Paz",
				})
				.buffer(true);

			// THEN
			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain("application/pdf");

			expect(response.headers["content-disposition"]).toContain("attachment");
			expect(response.headers["content-disposition"]).toContain("event_report");

			expect(response.body).toBeInstanceOf(Buffer);
			expect(response.body.length).toBeGreaterThan(0);

			expect(response.body.subarray(0, 4).toString()).toBe("%PDF");
		});
	});

	describe("Generate event report in xlsx format", () => {
		it("should return a valid XLSX file given valid request, when generating xlsx", async () => {
			// WHEN
			const response = await request(app)
				.get(RESOURCE_URL)
				.query({
					descending: true,
					fileName: "event_report",
					databaseName: "enterprise_1_db",
					format: "excel",
					zoneId: "America/La_Paz",
				})
				.buffer(true)
				.parse(binaryParser);

			// THEN
			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);

			expect(response.headers["content-disposition"]).toContain("inline");
			expect(response.headers["content-disposition"]).toContain("event_report");

			expect(response.body).toBeInstanceOf(Buffer);
			expect(response.body.length).toBeGreaterThan(0);

			expect(response.body.subarray(0, 4).toString()).toBe("PK\x03\x04");
		});
	});
});
