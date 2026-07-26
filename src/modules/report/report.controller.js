import { eventReportQueryParam } from "./dto/event-report-query-param.js";
import { eventReport } from "./event-report.js";

export class ReportController {
	#resource = "reports";
	#axios;
	#getDatabaseConfig;

	/**
	 * @param {object} request
	 * @param {import('axios')} request.axios
	 * @param {ReturnType<typeof import('./common/get-database-config.js').getDatabaseConfig>} request.getDatabaseConfig
	 */
	constructor({ axios, getDatabaseConfig }) {
		this.#axios = axios;
		this.#getDatabaseConfig = getDatabaseConfig;
	}

	/** @param {import('express').Application} app*/
	registerRoutes(app, basePath) {
		app.get(`${basePath}/${this.#resource}/events`, (req, res) =>
			this.#handleEventGet(req, res),
		);
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleEventGet(req, res) {
		const validQueryParams = eventReportQueryParam.parse(req.query);

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
			// return excel file with data requested
			return;
		}

		await this.#handleEventReportPdf({ validQueryParams, res, dbConfig });
	}

	/**
	 * @param {object} request
	 * @param {ReturnType<typeof eventReportQueryParam.parse>} request.validQueryParams
	 * @param {import('express').Response} request.res
	 * @param {ReturnType<typeof import('./common/get-database-config.js').getDatabaseConfig>} request.dbConfig
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

		await eventReport({
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
}
