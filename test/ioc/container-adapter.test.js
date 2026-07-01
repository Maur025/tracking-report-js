import { vi, describe, beforeEach, afterEach, test, expect } from "vitest";
import { ContainerAdapter } from "../../src/config/ioc/container-adapter.js";

describe("ContainerAdapter test", () => {
	/** @type {ContainerAdapter} */
	let containerAdapter;

	let mockResolve;
	let mockRegister;
	let mockContainer;

	beforeEach(() => {
		mockResolve = vi.fn();
		mockRegister = vi.fn();

		mockContainer = {
			resolve: mockResolve,
			register: mockRegister,
		};

		containerAdapter = new ContainerAdapter({ container: mockContainer });
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test("should return container instance", () => {
		const container = containerAdapter.getContainer();
		expect(container).toBe(mockContainer);
	});

	test("should resolve dependency using container", () => {
		// GIVEN
		const dependencyName = "testDependency";
		const expectedValue = "resolvedValue";
		mockResolve.mockReturnValue(expectedValue);

		// WHEN
		const resolvedValue = containerAdapter.resolve(dependencyName);

		//THEN
		expect(resolvedValue).toBeDefined();
		expect(resolvedValue).toBe(expectedValue);
	});

	test("should register value in container", () => {
		// GIVEN
		const key = "testKey";
		const value = "testValue";

		// WHEN
		containerAdapter.registerValue(key, value);

		// THEN
		expect(mockRegister).toHaveBeenCalledWith(
			expect.objectContaining({
				[key]: expect.any(Object),
			}),
		);
	});
});
