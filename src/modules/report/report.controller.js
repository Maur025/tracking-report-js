import { getFormatDate } from "../../core/common/get-format-date.js";
import { buildDocument, initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import { getEventValues } from "./common/event-report-common.js";
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

		const builder = buildDocument(
			reportTable({
				dataSource,
				mainTitle: "REPORTE DE EVENTOS",
				header: { userName: "Usuario de Prueba" },
				table: {
					columnWidths: [30, 80, 80, 100, 96, 100],
					headers: [
						{ text: "Nro", fontSize: 10 },
						{ text: "Fecha", fontSize: 10 },
						{ text: "Tipo", fontSize: 10 },
						{ text: "Regla", fontSize: 10 },
						{ text: "Vehículo", fontSize: 10 },
						{ text: "Evento", fontSize: 10 },
					],
					body: (item, index) => {
						const { eventName, eventDetail } = getEventValues(item);
						const formattedDate = getFormatDate({ date: new Date(item.date) });

						return [
							{ text: index, fontSize: 9 },
							{ text: formattedDate, fontSize: 9 },
							{ text: eventName, fontSize: 9 },
							{ text: item.rule, fontSize: 9 },
							{ text: item.vehicles, fontSize: 9 },
							{ text: eventDetail, fontSize: 9 },
						];
					},
				},
			}),
		);

		builder(
			initDocument({
				pageSize: "LETTER",
				pageMargins: { top: 2, bottom: 1, left: 2.5, right: 1, unit: "cm" },
				res,
				disposition,
				fileName,
			}),
		);

		// await eventReport({ res, reportData: eventData });
	}
}
