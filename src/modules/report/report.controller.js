import { buildDocument, initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import { eventReportStream } from "./event-report-stream.js";

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
		const {
			sortBy = "date",
			descending = true,
			disposition = "inline",
			fileName = "example",
		} = req.query;

		const dataSource = () =>
			eventReportStream({
				axios: this.#axios,
				database: {
					name: "trackingdb",
					host: "http://172.20.1.5:9999",
				},
				pagination: { sortBy, descending },
			});

		// const eventData = await eventReportGetData({
		// 	axios: this.#axios,
		// 	dbHost: "http://172.20.1.5:9999",
		// 	dbName: "trackingdb",
		// 	pagination: {
		// 		page: Number(page),
		// 		size: Number(size),
		// 		sortBy,
		// 		descending: Boolean(descending),
		// 	},
		// });

		const builder = buildDocument(reportTable(dataSource));

		const document = builder(
			initDocument({
				pageSize: "LETTER",
				pageMargins: { top: 2, bottom: 1, left: 2.5, right: 1, unit: "cm" },
				res,
				disposition,
				fileName,
			}),
		);

		console.log(document);

		// await eventReport({ res, reportData: eventData });
	}
}
