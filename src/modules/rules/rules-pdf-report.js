import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import {
	getFrequencies,
	getRuleName,
	getRuleEvents,
	getRuleScope,
	getRuleOperationalContext,
} from "./common/rule-report-common.js";
import { rulesReportStream } from "./rules-stream.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {import('express').Response} request.res
 * @param {{disposition: string, fileName: string, zoneId?:string}} request.reportParams
 * @param {{name:string, host:string}} request.databaseConfig
 * @param {{sortBy: string, descending: boolean}} request.paginationParams
 * @param {Record<string, unknown>} request.reportFilters
 * @param {{name:string, color:string, image:string}} request.enterpriseData
 * @param {string} request.filterByLabel
 */
export const rulesPdfReport = async ({
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
		mainTitle: "REGLAS CONFIGURADAS",
		header: {
			userName: "Usuario de Prueba",
			filterBy: filterByLabel,
			enterpriseName: enterpriseData.name,
			enterpriseLogo: enterpriseData.image,
		},
		table: {
			columnWidths: [30, 110, 110, 80, 70, 90],
			headers: [
				{ text: "Nro", fontSize: 9 },
				{ text: "Nombre", fontSize: 9 },
				{ text: "Frecuencia", fontSize: 9 },
				{ text: "Eventos", fontSize: 9 },
				{ text: "Alcance", fontSize: 9 },
				{ text: "Contexto Operativo", fontSize: 9 },
			],
			body: (item, index) => [
				{ text: index, fontSize: 8 },
				{ text: getRuleName(item.name, item.type), fontSize: 8 },
				{ text: getFrequencies(item.frequency, reportParams.zoneId), fontSize: 8 },
				{ text: getRuleEvents(item.alerts, item.notifications), fontSize: 8 },
				{ text: getRuleScope(item.groups, item.vehicles), fontSize: 8 },
				{
					text: getRuleOperationalContext(
						item.geofences,
						item.interestPoints,
						item.sensors,
					),
					fontSize: 8,
				},
			],
		},
		zoneId: reportParams.zoneId,
	});

	build(document);
};
