import { asClass, asFunction, asValue, createContainer, InjectionMode, listModules } from "awilix";
import express from "express";
import { environment } from "../environment.js";
import { ServerApp } from "../../core/server-app.js";
import { ReportController } from "../../modules/report/report.controller.js";
import { ErrorHandler } from "../../core/error-handler.js";
import { ContainerAdapter } from "./container-adapter.js";
import { enterpriseConfigDbRepository } from "../../modules/enterprise/enterprise-config-db.repository.js";
import axios from "axios";

const iocContainer = createContainer({
	injectionMode: InjectionMode.PROXY,
	strict: true,
});

const controllerModules = listModules("**/*.controller.js").map((module) => {
	return { ...module, name: module.name.replace(".controller", "Controller") };
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
	reportController: asClass(ReportController).singleton(),

	controllers: asFunction(() =>
		controllerModules.map((module) => iocContainer.resolve(module.name)),
	).singleton(),

	//repositories
	enterpriseConfigDbRepository: asFunction(enterpriseConfigDbRepository).singleton(),
});

export { iocContainer };
