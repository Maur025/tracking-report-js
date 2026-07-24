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
		console.log(req.query);

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
		} = eventReportQueryParam.parse(req.query);

		const { getConfig } = this.#getDatabaseConfig;

		const { host, enterprise } = await getConfig({
			databaseName,
		});

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
