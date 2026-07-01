import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { ServerApp } from "../../src/core/server-app.js";

describe("ServerApp test", () => {
	/** @type {ServerApp} */
	let serverApp;

	const mockEnvironment = {
		APP_STATIC_PUBLIC_PATH: "./public",
		APP_PORT: 3000,
	};

	const mockControllerTest = { registerRoutes: vi.fn() };
	const mockControllers = [mockControllerTest];

	/** @type {import('vitest').Mock} */
	let mockExpress;
	let mockExpressJson;
	let mockExpressText;
	let mockExpressUrlEncoded;
	let mockExpressStatic;

	let mockApp;
	let mockAppUse;
	let mockListen;

	let mockRegisterValue;

	let consoleErrorSpy;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		mockAppUse = vi.fn();
		mockListen = vi.fn();
		mockApp = { use: mockAppUse, listen: mockListen };

		mockExpressJson = vi.fn();
		mockExpressText = vi.fn();
		mockExpressUrlEncoded = vi.fn();
		mockExpressStatic = vi.fn();

		mockExpress = vi.fn();
		mockExpress.json = mockExpressJson;
		mockExpress.text = mockExpressText;
		mockExpress.urlencoded = mockExpressUrlEncoded;
		mockExpress.static = mockExpressStatic;

		mockRegisterValue = vi.fn();
		const mockContainerAdapter = {
			registerValue: mockRegisterValue,
		};

		serverApp = new ServerApp({
			express: mockExpress,
			environment: mockEnvironment,
			controllers: mockControllers,
			containerAdapter: mockContainerAdapter,
		});
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test("should initialize express app", () => {
		// GIVEN
		mockExpress.mockReturnValue(mockApp);
		const expectedJsonSize = "25mb";
		const expectedTextSize = "25mb";
		const expectedUrlEncoded = {
			extended: true,
			parameterLimit: 100_000,
			limit: "25mb",
		};

		// WHEN
		serverApp.initialize();

		// THEN
		expect(mockExpress).toHaveBeenCalled();
		expect(mockAppUse).toHaveBeenCalled();
		expect(mockExpressJson).toHaveBeenCalledWith({ limit: expectedJsonSize });
		expect(mockExpressText).toHaveBeenCalledWith({ limit: expectedTextSize });
		expect(mockExpressUrlEncoded).toHaveBeenCalledWith(expectedUrlEncoded);
		expect(mockExpressStatic).toHaveBeenCalledWith(mockEnvironment.APP_STATIC_PUBLIC_PATH);
		expect(mockControllerTest.registerRoutes).toHaveBeenCalledWith(mockApp, "/api");
		expect(mockRegisterValue).toHaveBeenCalledWith("expressApp", mockApp);
	});

	test("should return app instance when initialized", () => {
		// GIVEN
		mockExpress.mockReturnValue(mockApp);

		// WHEN
		serverApp.initialize();
		const app = serverApp.getApp();

		// THEN
		expect(app).toBe(mockApp);
	});

	test("should return null instance when not initialized", () => {
		// GIVEN
		mockExpress.mockReturnValue(mockApp);

		// WHEN
		const app = serverApp.getApp();

		// THEN
		expect(app).toBeNull();
	});

	test("should print error log when listen is called without initialization", () => {
		serverApp.listen();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(`Express app is not initialized`),
		);
		expect(mockListen).not.toHaveBeenCalled();
	});

	test("should start listen when call method listen with initialized app", () => {
		// GIVEN
		mockExpress.mockReturnValue(mockApp);

		// WHEN
		serverApp.initialize();
		serverApp.listen();

		// THEN
		expect(mockListen).toHaveBeenCalledWith(mockEnvironment.APP_PORT, expect.any(Function));
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});
});
