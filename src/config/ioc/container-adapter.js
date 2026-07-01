import { asValue } from "awilix";

export class ContainerAdapter {
	#container;

	/**
	 * @param {object} dep
	 * @param {import('awilix').AwilixContainer} dep.container
	 */
	constructor({ container }) {
		this.#container = container;
	}

	getContainer() {
		return this.#container;
	}

	resolve(dependencyName) {
		return this.#container.resolve(dependencyName);
	}

	/**
	 * @param {string} key
	 * @param value
	 */
	registerValue(key, value) {
		this.#container.register({
			[key]: asValue(value),
		});
	}
}
