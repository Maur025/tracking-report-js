import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
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
export const progressExcelReport = async ({
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

	const { workbook, closeWorkbook } = generateExcel({
		res,
		disposition: reportParams.disposition,
		fileName: reportParams.fileName,
	});

	const reportBuilder = reportTable({
		dataSource,
		mainTitle: "PROGRESOS REGISTRADOS",
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
				{ value: "Nombre", width: 35 },
				{ value: "Frecuencia", width: 30 },
				{ value: "Alcance", width: 20 },
				{ value: "Contexto Operativo", width: 20 },
				{ value: "Registros", width: 15 },
			],
			body: (item, index) => [
				{ value: index },
				{ value: getProgressName(item.name, item.type, item.frequencyType) },
				{ value: getFrequencies(item.frequencies, reportParams.zoneId) },
				{ value: getProgressScope(item.groups, item.vehicles) },
				{
					value: getProgressOperationalContext(
						item.route,
						item.geofences,
						item.interestPoints,
					),
				},
				{ value: getProgressRecords(item.records) },
			],
		},
		font: "Inter",
		zoneId: reportParams.zoneId,
	});

	await reportBuilder({ workbook, closeWorkbook });
};
