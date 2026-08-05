import { eventReportQueryParam } from "./dto/event-report-query-param.js";
import { eventExcelReport } from "./event-excel-report.js";
import { eventPdfReport } from "./event-pdf-report.js";
import { HttpStatusCode } from "axios";
import { dateFilterProcess } from "../../core/common/date/date-filter-process.js";
import { eventReportGetData } from "./event-report-get-data.js";
import { serverResponse } from "../../core/server-response.js";

export class EventReportController {
	#resource = "reports/events";

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

		app.get(path, (req, res) => this.#handleEventGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleEventGet(req, res) {
		const validQueryParams = eventReportQueryParam.parse(req.query);

		const dateFilters = dateFilterProcess({ ...validQueryParams });

		const reportFilters = {
			vehicleId: validQueryParams.vehicleId,
			ruleId: validQueryParams.ruleId,
			inout: validQueryParams.inout,
			geofenceId: validQueryParams.geofenceId,
			type: validQueryParams.type,
			deventId: validQueryParams.deventId,
			...dateFilters,
		};

		if (
			validQueryParams.format &&
			!["json", "excel", "pdf"].includes(validQueryParams.format)
		) {
			return res
				.status(HttpStatusCode.BadRequest)
				.json({ error: "Invalid format parameter" });
		}

		const { getConfig } = this.#getDatabaseConfig;

		const dbConfig = await getConfig({
			databaseName: validQueryParams.databaseName,
		});

		if (!validQueryParams.format || validQueryParams.format === "json") {
			return this.#handleEventReportJson({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
		}

		if (validQueryParams.format === "excel") {
			await this.#handleEventReportExcel({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
			return;
		}

		await this.#handleEventReportPdf({
			validQueryParams,
			res,
			dbConfig,
			reportFilters,
		});
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof eventReportQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleEventReportJson({ validQueryParams, res, dbConfig, reportFilters }) {
		const eventData = await eventReportGetData({
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
				data: eventData.data,
				code: HttpStatusCode.Ok,
				pagination: eventData.pagination,
			}),
		);
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof eventReportQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleEventReportPdf({ validQueryParams, res, dbConfig, reportFilters }) {
		await eventPdfReport({
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
	 * 	validQueryParams: ReturnType<typeof eventReportQueryParam.parse>;
	 * 	res: import('express').Response;
	 * 	dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object;
	 * }} request
	 */
	async #handleEventReportExcel({ validQueryParams, res, dbConfig, reportFilters }) {
		await eventExcelReport({
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
