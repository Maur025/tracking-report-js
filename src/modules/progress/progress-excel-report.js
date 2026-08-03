import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
import { progressReportStream } from "./progress-stream.js";

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
		mainTitle: "REPORTE DE PROGRESS",
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
				{ value: "Tipo", width: 15 },
				{ value: "Nombre", width: 20 },
				{ value: "Frecuencia Tipo", width: 18 },
				{ value: "Frecuencia", width: 35 },
				{ value: "Grupos", width: 35 },
				{ value: "Vehículos", width: 35 },
			],
			body: (item, index) => [
				{ value: index },
				{ value: item.type ?? "N/A" },
				{ value: item.name ?? "N/A" },
				{ value: item.frequency_type ?? "N/A" },
				{ value: item.frequency ?? "N/A" },
				{ value: item.groups ?? "N/A" },
				{ value: item.vehicles ?? "N/A" },
			],
		},
		font: "Inter",
	});

	await reportBuilder({ workbook, closeWorkbook });
};
