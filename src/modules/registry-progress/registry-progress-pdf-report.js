import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import {
	getDate,
	getItemProgressName,
	getProgressValue,
	getTypeProgress,
	getVehicleName,
} from "./common/registry-progress-report-common.js";
import { registryProgressReportStream } from "./registry-progress-stream.js";

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
		mainTitle: "REGISTRO DE PROGRESO",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 90, 90, 60, 90, 90, 60],
			headers: [
				{ text: "Nro", fontSize: 9 },
				{ text: "Desde", fontSize: 9 },
				{ text: "Hasta", fontSize: 9 },
				{ text: "Tipo", fontSize: 9 },
				{ text: "Nombre", fontSize: 9 },
				{ text: "Vehículo", fontSize: 9 },
				{ text: "Progreso", fontSize: 9 },
			],
			body: (item, index) => [
				{ text: index, fontSize: 8 },
				{ text: getDate(item.dateFrom, reportParams.zoneId), fontSize: 8 },
				{ text: getDate(item.dateTo, reportParams.zoneId), fontSize: 8 },
				{ text: getTypeProgress(item.type), fontSize: 8 },
				{
					text: getItemProgressName(item.progressName, item.progressFrequencyType),
					fontSize: 8,
				},
				{ text: getVehicleName(item.vehicle), fontSize: 8 },
				{ text: getProgressValue(item.progressValue), fontSize: 8 },
			],
		},
		zoneId: reportParams.zoneId,
	});

	build(document);
};
