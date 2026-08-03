import { getFormatDate } from "../../core/common/get-format-date.js";
import { generateExcel } from "../../core/excel/generate-excel.js";
import { reportTable } from "../../core/excel/report-table.js";
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
		mainTitle: "REPORTE REGISTRY PROGRESS",
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
				{ value: "Progreso", width: 35 },
				{ value: "Vehículo", width: 30 },
				{ value: "Rutas", width: 25 },
			],
			body: (item, index) => {
				const fromDate = item.date_from
					? getFormatDate({ date: new Date(item.date_from) })
					: "N/A";
				const toDate = item.date_to
					? getFormatDate({ date: new Date(item.date_to) })
					: "N/A";
				const typeValue = Array.isArray(item.type)
					? item.type.join(", ")
					: (item.type ?? "N/A");
				const vehicleValue = Array.isArray(item.vehicle)
					? item.vehicle.join(", ")
					: (item.vehicle ?? "N/A");
				const progressValue = item.progress
					? `${item.progress.name ?? "N/A"} / ${item.progress.frequency_type ?? "N/A"}`
					: "N/A";
				const routesValue = Array.isArray(item.routes)
					? item.routes.map((route) => (route?.completed ? "Sí" : "No")).join(", ")
					: (item.routes ?? "N/A");

				return [
					{ value: index },
					{ value: fromDate },
					{ value: toDate },
					{ value: typeValue },
					{ value: progressValue },
					{ value: vehicleValue },
					{ value: routesValue },
				];
			},
		},
		font: "Inter",
	});

	await reportBuilder({ workbook, closeWorkbook });
};
