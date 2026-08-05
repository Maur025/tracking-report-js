import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
import {
	getFrequencies,
	getRuleEvents,
	getRuleName,
	getRuleOperationalContext,
	getRuleScope,
} from "./common/rule-report-common.js";
import { rulesReportStream } from "./rules-stream.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {import('express').Response} request.res
 * @param {{disposition: string, fileName: string}} request.reportParams
 * @param {{name:string, host:string}} request.databaseConfig
 * @param {{sortBy: string, descending: boolean}} request.paginationParams
 * @param {Record<string, unknown>} request.reportFilters
 * @param {{name:string, color:string, image:string}} request.enterpriseData
 * @param {string} request.filterByLabel
 */
export const rulesExcelReport = async ({
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
		rulesReportStream({
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
		mainTitle: "REGLAS CONFIGURADAS",
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
				{ value: "Eventos", width: 20 },
				{ value: "Alcance", width: 20 },
				{ value: "Contexto Operativo", width: 20 },
			],
			body: (item, index) => [
				{ value: index },
				{ value: getRuleName(item.name, item.type) },
				{ value: getFrequencies(item.frequency, reportParams.zoneId) },
				{ value: getRuleEvents(item.alerts, item.notifications) },
				{ value: getRuleScope(item.groups, item.vehicles) },
				{
					value: getRuleOperationalContext(
						item.geofences,
						item.interestPoints,
						item.sensors,
					),
				},
			],
		},
		font: "Inter",
	});

	await reportBuilder({ workbook, closeWorkbook });
};
