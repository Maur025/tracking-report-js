import { HttpStatusCode } from "axios";
import { progressQueryParam } from "./dto/progress-query-param.js";
import { progressExcelReport } from "./progress-excel-report.js";
import { progressPdfReport } from "./progress-pdf-report.js";
import { progressReportGetData } from "./progress-get-data.js";
import { serverResponse } from "../../core/server-response.js";
import { dateFilterProcess } from "../../core/common/date/date-filter-process.js";

export class ProgressController {
	#resource = "reports/progress";

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

		app.get(path, (req, res) => this.#handleProgressGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleProgressGet(req, res) {
		const validQueryParams = progressQueryParam.parse(req.query);

		const dateFilters = dateFilterProcess({ ...validQueryParams });

		const reportFilters = {
			...dateFilters,
		};

		const { getConfig } = this.#getDatabaseConfig;

		const dbConfig = await getConfig({
			databaseName: validQueryParams.databaseName,
		});

		if (!validQueryParams.format || validQueryParams.format === "json") {
			return this.#handleProgressReportJson({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
		}

		if (validQueryParams.format === "excel") {
			await this.#handleProgressReportExcel({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
			return;
		}

		await this.#handleProgressReportPdf({
			validQueryParams,
			res,
			dbConfig,
			reportFilters,
		});
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof progressQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleProgressReportJson({ validQueryParams, res, dbConfig, reportFilters }) {
		const progressData = await progressReportGetData({
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
				data: progressData.data,
				code: HttpStatusCode.Ok,
				pagination: progressData.pagination,
			}),
		);
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof progressQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleProgressReportPdf({ validQueryParams, res, dbConfig, reportFilters }) {
		await progressPdfReport({
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
	 * 	validQueryParams: ReturnType<typeof progressQueryParam.parse>;
	 * 	res: import('express').Response;
	 * 	dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object;
	 * }} request
	 */
	async #handleProgressReportExcel({ validQueryParams, res, dbConfig, reportFilters }) {
		await progressExcelReport({
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
