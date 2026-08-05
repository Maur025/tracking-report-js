import { getFormatDate } from "../../core/common/date/get-format-date.js";
import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import { getEventValues } from "./common/event-report-common.js";
import { eventReportStream } from "./event-report-stream.js";

/**
 * @param {object} request
 * @param {import('axios')} request.axios
 * @param {import('express').Response} request.res
 * @param {{disposition: string, fileName: string}} request.reportParams
 * @param {{name:string, host:string}} request.databaseConfig
 * @param {{sortBy: string, descending: string}} request.paginationParams
 * @param {Record<string, unknown>} request.reportFilters
 * @param {{name:string, color:string, image:string}} request.enterpriseData
 * @param {string} request.filterByLabel
 */
export const eventPdfReport = async ({
	axios,
	res,
	reportParams,
	databaseConfig,
	paginationParams,
	reportFilters,
	enterpriseData,
	filterByLabel,
}) => {
	const dataSource = () =>
		eventReportStream({
			axios,
			database: databaseConfig,
			pagination: paginationParams,
			filters: reportFilters,
		});

	const document = initDocument({
		pageSize: "LETTER",
		pageMargins: { top: 2, bottom: 1, left: 2.5, right: 1, unit: "cm" },
		res,
		disposition: reportParams.disposition,
		fileName: reportParams.fileName,
		fonts: ["Inter"],
	});

	const build = reportTable({
		dataSource,
		mainTitle: "EVENTOS REGISTRADOS",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 90, 70, 110, 80, 110],
			headers: [
				{ text: "Nro", fontSize: 9 },
				{ text: "Fecha", fontSize: 9 },
				{ text: "Tipo", fontSize: 9 },
				{ text: "Regla", fontSize: 9 },
				{ text: "Vehículo", fontSize: 9 },
				{ text: "Evento", fontSize: 9 },
			],
			body: (item, index) => {
				const { eventName, eventDetail } = getEventValues(item);
				const formattedDate = getFormatDate({ date: new Date(item.date) });

				return [
					{ text: index, fontSize: 8 },
					{ text: formattedDate, fontSize: 8 },
					{ text: eventName, fontSize: 8 },
					{ text: item.rule, fontSize: 8 },
					{ text: item.vehicles, fontSize: 8 },
					{ text: eventDetail, fontSize: 8 },
				];
			},
		},
	});

	build(document);
};
