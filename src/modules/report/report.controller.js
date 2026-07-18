import { eventReportGetData } from "./event-report-get-data.js";
import { eventReport } from "./event-report.js";

export class ReportController {
	#resource = "reports";
	#axios;

	/**
	 * @param {object} request
	 * @param {import('axios')} request.axios
	 */
	constructor({ axios }) {
		this.#axios = axios;
	}

	/** @param {import('express').Application} app*/
	registerRoutes(app, basePath) {
		app.get(`${basePath}/${this.#resource}`, (req, res) => this.#handleDefaultGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleDefaultGet(req, res) {
		const { page = 0, size = 20, sortBy = "date", descending = true } = req.query;

		const eventData = await eventReportGetData({
			axios: this.#axios,
			dbHost: "http://172.20.1.5:9999",
			dbName: "trackingdb",
			pagination: {
				page: Number(page),
				size: Number(size),
				sortBy,
				descending: Boolean(descending),
			},
		});

		await eventReport({ res, reportData: eventData });
	}
}
