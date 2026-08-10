import { registryProgressQueryParam } from "./dto/registry-progress-query-param.js";
import { registryProgressExcelReport } from "./registry-progress-excel-report.js";
import { registryProgressPdfReport } from "./registry-progress-pdf-report.js";
import { HttpStatusCode } from "axios";
import { dateFilterProcess } from "../../core/common/date/date-filter-process.js";
import { registryProgressReportGetData } from "./registry-progress-get-data.js";
import { serverResponse } from "../../core/server-response.js";

export class RegistryProgressController {
	#resource = "reports/registry-progress";

	#axios;
	#getDatabaseConfig;

	/**
	 * @param {{
	 * axios: import("axios");
	 * getDatabaseConfig: ReturnType<typeof import("../../core/common/action/get-database-config.js").getDatabaseConfig>;
	 * }} request
	 */
	constructor({ axios, getDatabaseConfig }) {
		this.#axios = axios;
		this.#getDatabaseConfig = getDatabaseConfig;
	}

	/**
	 * @param {import('express').Application} app
	 * @param {string} basePath
	 */
	registerRoutes(app, basePath) {
		const path = `${basePath}/${this.#resource}`;

		app.get(path, (req, res) => this.#handleRegistryProgressGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleRegistryProgressGet(req, res) {
		const validQueryParams = registryProgressQueryParam.parse(req.query);

		const dateFilters = dateFilterProcess({ ...validQueryParams });

		const reportFilters = {
			type: validQueryParams.type,
			vehicle: validQueryParams.vehicle,
			progress: validQueryParams.progress,
			...dateFilters,
		};

		const { getConfig } = this.#getDatabaseConfig;

		const dbConfig = await getConfig({
			databaseName: validQueryParams.databaseName,
		});

		if (!validQueryParams.format || validQueryParams.format === "json") {
			return this.#handleRegistryProgressJson({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
		}

		if (validQueryParams.format === "excel") {
			await this.#handleRegistryProgressExcel({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
			return;
		}

		await this.#handleRegistryProgressPdf({
			validQueryParams,
			res,
			dbConfig,
			reportFilters,
		});
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof registryProgressQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleRegistryProgressJson({ validQueryParams, res, dbConfig, reportFilters }) {
		const registryProgressData = await registryProgressReportGetData({
			axios: this.#axios,
			dbName: dbConfig.name,
			dbHost: dbConfig.host,
			pagination: {
				page: validQueryParams.page,
				size: validQueryParams.size,
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			filters: reportFilters,
		});

		return res.status(HttpStatusCode.Ok).json(
			serverResponse({
				data: registryProgressData.data,
				code: HttpStatusCode.Ok,
				pagination: registryProgressData.pagination,
			}),
		);
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof registryProgressQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleRegistryProgressPdf({ validQueryParams, res, dbConfig, reportFilters }) {
		await registryProgressPdfReport({
			axios: this.#axios,
			res,
			enterpriseData: dbConfig.enterprise,
			reportParams: {
				disposition: validQueryParams.disposition,
				fileName: validQueryParams.fileName,
				zoneId: validQueryParams.zoneId,
			},
			databaseConfig: dbConfig,
			paginationParams: {
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			reportFilters,
			filterByLabel: validQueryParams.filterByLabel,
		});
	}

	/**
	 * @param {{
	 * 	validQueryParams: ReturnType<typeof registryProgressQueryParam.parse>;
	 * 	res: import('express').Response;
	 * 	dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object;
	 * }} request
	 */
	async #handleRegistryProgressExcel({ validQueryParams, res, dbConfig, reportFilters }) {
		await registryProgressExcelReport({
			axios: this.#axios,
			res,
			reportParams: {
				disposition: validQueryParams.disposition,
				fileName: validQueryParams.fileName,
				zoneId: validQueryParams.zoneId,
			},
			databaseConfig: { name: validQueryParams.databaseName, host: dbConfig.host },
			paginationParams: {
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			reportFilters,
			enterpriseData: dbConfig.enterprise,
			filterByLabel: validQueryParams.filterByLabel,
		});
	}
}
