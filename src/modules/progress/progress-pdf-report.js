import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import {
	getFrequencies,
	getProgressName,
	getProgressOperationalContext,
	getProgressRecords,
	getProgressScope,
} from "./common/progress-report-common.js";
import { progressReportStream } from "./progress-stream.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {import('express').Response} request.res
 * @param {{disposition: string, fileName: string, zoneId:string}} request.reportParams
 * @param {{name:string, host:string}} request.databaseConfig
 * @param {{sortBy: string, descending: boolean}} request.paginationParams
 * @param {Record<string, unknown>} request.reportFilters
 * @param {{name:string, color:string, image:string}} request.enterpriseData
 * @param {string} request.filterByLabel
 */
export const progressPdfReport = async ({
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
		progressReportStream({
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
		mainTitle: "PROGRESOS REGISTRADOS",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 110, 110, 70, 110, 70],
			headers: [
				{ text: "Nro", fontSize: 9 },
				{ text: "Nombre", fontSize: 9 },
				{ text: "Frecuencia", fontSize: 9 },
				{ text: "Alcance", fontSize: 9 },
				{ text: "Contexto Operativo", fontSize: 9 },
				{ text: "Registros", fontSize: 9 },
			],
			body: (item, index) => [
				{ text: index, fontSize: 8 },
				{ text: getProgressName(item.name, item.type, item.frequencyType), fontSize: 8 },
				{ text: getFrequencies(item.frequencies, reportParams.zoneId), fontSize: 8 },
				{ text: getProgressScope(item.groups, item.vehicles), fontSize: 8 },
				{
					text: getProgressOperationalContext(
						item.route,
						item.geofences,
						item.interestPoints,
					),
					fontSize: 8,
				},
				{ text: getProgressRecords(item.records), fontSize: 8 },
			],
		},
		zoneId: reportParams.zoneId,
	});

	build(document);
};
