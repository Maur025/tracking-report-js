import { getFormatDate } from "../../core/common/get-format-date.js";
import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
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
export const registryProgressPdfReport = async ({
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
		mainTitle: "REPORTE REGISTRY PROGRESS",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 70, 70, 70, 80, 90, 90],
			headers: [
				{ text: "Nro", fontSize: 10 },
				{ text: "Desde", fontSize: 10 },
				{ text: "Hasta", fontSize: 10 },
				{ text: "Tipo", fontSize: 10 },
				{ text: "Progreso", fontSize: 10 },
				{ text: "Vehículo", fontSize: 10 },
				{ text: "Rutas", fontSize: 10 },
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
					{ text: index, fontSize: 9 },
					{ text: fromDate, fontSize: 9 },
					{ text: toDate, fontSize: 9 },
					{ text: typeValue, fontSize: 9 },
					{ text: progressValue, fontSize: 9 },
					{ text: vehicleValue, fontSize: 9 },
					{ text: routesValue, fontSize: 9 },
				];
			},
		},
	});

	build(document);
};
