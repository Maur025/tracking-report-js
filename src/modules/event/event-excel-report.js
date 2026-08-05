import { getFormatDate } from "../../core/common/date/get-format-date.js";
import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
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
export const eventExcelReport = async ({
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

	const { workbook, closeWorkbook } = generateExcel({
		res,
		disposition: reportParams.disposition,
		fileName: reportParams.fileName,
	});

	const reportBuilder = reportTable({
		dataSource,
		mainTitle: "REPORTE DE EVENTOS",
		header: {
			userName: { value: "Usuario de Prueba" },
			filterBy: { value: filterByLabel },
			enterpriseName: {
				value: enterpriseData.name,
				bold: true,
				fontSize: 12,
			},
			enterpriseLogo: { value: enterpriseData.image },
		},
		table: {
			headers: [
				{ value: "Nro", width: 10 },
				{ value: "Fecha", width: 20 },
				{ value: "Tipo", width: 15 },
				{ value: "Regla", width: 40 },
				{ value: "Vehículo", width: 30 },
				{ value: "Evento", width: 60 },
			],
			body: (item, index) => {
				const { eventName, eventDetail } = getEventValues(item);
				const formattedDate = getFormatDate({ date: new Date(item.date) });

				return [
					{ value: index },
					{ value: formattedDate },
					{ value: eventName },
					{ value: item.rule },
					{ value: item.vehicles },
					{ value: eventDetail },
				];
			},
		},
		font: "Inter",
	});

	await reportBuilder({ workbook, closeWorkbook });
};
