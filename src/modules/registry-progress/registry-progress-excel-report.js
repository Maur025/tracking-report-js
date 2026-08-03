import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
import {
	getDate,
	getItemProgressName,
	getTypeProgress,
	getVehicleName,
} from "./common/registry-progress-report-common.js";
import { registryProgressReportStream } from "./registry-progress-stream.js";

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
export const registryProgressExcelReport = async ({
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
		registryProgressReportStream({
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
		mainTitle: "REGISTRO DE PROGRESO",
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
				{ value: "Desde", width: 20 },
				{ value: "Hasta", width: 20 },
				{ value: "Tipo", width: 15 },
				{ value: "Nombre", width: 35 },
				{ value: "Vehículo", width: 30 },
				{ value: "Progreso (%)", width: 15 },
			],
			body: (item, index) => [
				{ value: index },
				{ value: getDate(item.dateFrom) },
				{ value: getDate(item.dateTo) },
				{ value: getTypeProgress(item.type) },
				{ value: getItemProgressName(item.progressName, item.progressFrequencyType) },
				{ value: getVehicleName(item.vehicle) },
				{ value: item.progressValue },
			],
		},
		font: "Inter",
	});

	await reportBuilder({ workbook, closeWorkbook });
};
