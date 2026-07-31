import { Temporal } from "@js-temporal/polyfill";
import { eventReportQueryParam } from "./dto/event-report-query-param.js";
import { eventExcelReport } from "./event-excel-report.js";
import { eventPdfReport } from "./event-pdf-report.js";

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

		console.log({ inputDate: validQueryParams.date });

		const dateNow = Temporal.Now.zonedDateTimeISO("America/La_Paz");

		const dateTest = Temporal.Now.zonedDateTimeISO("UTC");
		const startDay = dateTest.with({
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
			microsecond: 0,
			nanosecond: 0,
		});

		const endDay = startDay.add({ days: 1 }).subtract({ nanoseconds: 1 });

		console.log({
			startDay: startDay.toInstant().toString(),
			endDay: endDay.toInstant().toString(),
			dateNow: dateNow.toInstant().toString(),
		});

		if (
			validQueryParams.format &&
			!["json", "excel", "pdf"].includes(validQueryParams.format)
		) {
			return res.status(400).json({ error: "Invalid format parameter" });
		}

		const { getConfig } = this.#getDatabaseConfig;

		const dbConfig = await getConfig({
			databaseName: validQueryParams.databaseName,
		});

		if (!validQueryParams.format || validQueryParams.format === "json") {
			// return json with data requested
			return res.status(200).json({ message: "JSON format not implemented yet" });
		}

		if (validQueryParams.format === "excel") {
			await this.#handleEventReportExcel({
				validQueryParams,
				res,
				dbConfig,
			});
			return;
		}

		await this.#handleEventReportPdf({
			validQueryParams,
			res,
			dbConfig,
		});
	}

	/**
	 * @param {object} request
	 * @param {ReturnType<typeof eventReportQueryParam.parse>} request.validQueryParams
	 * @param {import('express').Response} request.res
	 * @param {ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>} request.dbConfig
	 */
	async #handleEventReportPdf({ validQueryParams, res, dbConfig }) {
		const { host, enterprise } = dbConfig;
		const {
			sortBy,
			descending,
			disposition,
			fileName,
			databaseName,
			vehicleId,
			ruleId,
			inout,
			geofenceId,
			type,
			deventId,
			filterByLabel,
		} = validQueryParams;

		await eventPdfReport({
			axios: this.#axios,
			res,
			enterpriseData: enterprise,
			reportParams: { disposition, fileName },
			databaseConfig: { name: databaseName, host },
			paginationParams: { sortBy, descending },
			reportFilters: {
				vehicleId,
				ruleId,
				inout,
				geofenceId,
				type,
				deventId,
			},
			filterByLabel,
		});
	}

	/**
	 * @param {object} request
	 * @param {ReturnType<typeof eventReportQueryParam.parse>} request.validQueryParams
	 * @param {import('express').Response} request.res
	 * @param {ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>} request.dbConfig
	 */
	async #handleEventReportExcel({ validQueryParams, res, dbConfig }) {
		await eventExcelReport({
			axios: this.#axios,
			res,
			reportParams: {
				disposition: validQueryParams.disposition,
				fileName: validQueryParams.fileName,
			},
			databaseConfig: { name: validQueryParams.databaseName, host: dbConfig.host },
			paginationParams: {
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			reportFilters: {
				vehicleId: validQueryParams.vehicleId,
				ruleId: validQueryParams.ruleId,
				inout: validQueryParams.inout,
				geofenceId: validQueryParams.geofenceId,
				type: validQueryParams.type,
				deventId: validQueryParams.deventId,
			},
			enterpriseData: dbConfig.enterprise,
			filterByLabel: validQueryParams.filterByLabel,
		});
	}
}
