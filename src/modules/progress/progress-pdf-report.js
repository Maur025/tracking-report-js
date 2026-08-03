import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
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
		mainTitle: "REPORTE DE PROGRESS",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 70, 80, 60, 70, 100, 100],
			headers: [
				{ text: "Nro", fontSize: 10 },
				{ text: "Tipo", fontSize: 10 },
				{ text: "Nombre", fontSize: 10 },
				{ text: "Frecuencia Tipo", fontSize: 10 },
				{ text: "Frecuencia", fontSize: 10 },
				{ text: "Grupos", fontSize: 10 },
				{ text: "Vehículos", fontSize: 10 },
			],
			body: (item, index) => [
				{ text: index, fontSize: 9 },
				{ text: item.type ?? "N/A", fontSize: 9 },
				{ text: item.name ?? "N/A", fontSize: 9 },
				{ text: item.frequency_type ?? "N/A", fontSize: 9 },
				{ text: item.frequency ?? "N/A", fontSize: 9 },
				{ text: item.groups ?? "N/A", fontSize: 9 },
				{ text: item.vehicles ?? "N/A", fontSize: 9 },
			],
		},
	});

	build(document);
};
