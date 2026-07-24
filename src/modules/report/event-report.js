import { getFormatDate } from "../../core/common/get-format-date.js";
import { initDocument } from "../../core/pdf/generate-pdf.js";
import { reportTable } from "../../core/pdf/report-table.js";
import { getEventValues } from "./common/event-report-common.js";
import { eventReportStream } from "./event-report-stream.js";

export const eventReport = async ({
	axios,
	res,
	reportParams,
	databaseConfig,
	paginationParams,
	reportFilters,
}) => {
	const dataSource = () =>
		eventReportStream({
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
	});

	const build = reportTable({
		dataSource,
		mainTitle: "REPORTE DE EVENTOS",
		header: { userName: "Usuario de Prueba" },
		table: {
			columnWidths: [30, 80, 80, 100, 96, 100],
			headers: [
				{ text: "Nro", fontSize: 10 },
				{ text: "Fecha", fontSize: 10 },
				{ text: "Tipo", fontSize: 10 },
				{ text: "Regla", fontSize: 10 },
				{ text: "Vehículo", fontSize: 10 },
				{ text: "Evento", fontSize: 10 },
			],
			body: (item, index) => {
				const { eventName, eventDetail } = getEventValues(item);
				const formattedDate = getFormatDate({ date: new Date(item.date) });

				return [
					{ text: index, fontSize: 9 },
					{ text: formattedDate, fontSize: 9 },
					{ text: eventName, fontSize: 9 },
					{ text: item.rule, fontSize: 9 },
					{ text: item.vehicles, fontSize: 9 },
					{ text: eventDetail, fontSize: 9 },
				];
			},
		},
	});

	build(document);
};
