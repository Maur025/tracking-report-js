import { asClass, asFunction, asValue, createContainer, InjectionMode, listModules } from "awilix";
import express from "express";
import { environment } from "../environment.js";
import { ServerApp } from "../../core/server-app.js";
import { ErrorHandler } from "../../core/error-handler.js";
import { ContainerAdapter } from "./container-adapter.js";
import { enterpriseConfigDbRepository } from "../../modules/enterprise/enterprise-config-db.repository.js";
import axios from "axios";
import { getDatabaseConfig } from "../../core/common/action/get-database-config.js";
import { enterpriseRepository } from "../../modules/enterprise/enterprise.repository.js";
import { socketClientHandler } from "../../core/socket-client/socket-client-handler.js";
import { EventReportController } from "../../modules/event/event-report.controller.js";
import { RegistryProgressController } from "../../modules/registry-progress/registry-progress.controller.js";
import { RulesController } from "../../modules/rules/rules.controller.js";

const iocContainer = createContainer({
	injectionMode: InjectionMode.PROXY,
	strict: true,
});

/** @param {string} name */
const getModuleName = (name) => {
	const parts = name
		.split("-")
		.map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)));

	const text = parts.join("");

	return text.replace(".controller", "Controller");
};

const controllerModules = listModules("**/*.controller.js").map((module) => {
	return { ...module, name: getModuleName(module.name) };
});

iocContainer.register({
	// external dependencies
	express: asValue(express),
	axios: asValue(axios),

	// config
	environment: asValue(environment),
	container: asValue(iocContainer),
	containerAdapter: asClass(ContainerAdapter).singleton(),

	// core
	serverApp: asClass(ServerApp).singleton(),
	errorHandler: asClass(ErrorHandler).singleton(),

	// app
	eventReportController: asClass(EventReportController).singleton(),
	registryProgressController: asClass(RegistryProgressController).singleton(),
	rulesController: asClass(RulesController).singleton(),

	controllers: asFunction(() =>
		controllerModules.map((module) => iocContainer.resolve(module.name)),
	).singleton(),

	//repositories
	enterpriseConfigDbRepository: asFunction(enterpriseConfigDbRepository).singleton(),
	enterpriseRepository: asFunction(enterpriseRepository).singleton(),

	// functions
	getDatabaseConfig: asFunction(getDatabaseConfig).singleton(),

	// Socket client
	socketClientHandler: asFunction(socketClientHandler).singleton(),
});

export { iocContainer };
