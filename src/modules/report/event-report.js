import { getFormatDate } from "../../core/common/get-format-date.js";
import { reportTableTemplate } from "../../core/pdf/report-table-template.js";
import { getEventValues } from "./common/event-report-common.js";

export const eventReport = async ({ res, reportData }) =>
	reportTableTemplate({
		res,
		table: {
			columnWidths: [20, 80, 80, 100, 96, 100],
			columns: [
				{ text: "Nro", style: "tableHeader" },
				{ text: "Fecha", style: "tableHeader" },
				{ text: "Tipo", style: "tableHeader" },
				{ text: "Regla", style: "tableHeader" },
				{ text: "Vehículo", style: "tableHeader" },
				{ text: "Evento", style: "tableHeader" },
			],
			rowData: reportData.map((item, index) => {
				const { eventName, eventDetail } = getEventValues(item);

				return [
					{ text: index + 1, style: "textTdTableLeft" },
					{
						text: getFormatDate({ date: new Date(item.date) }),
						style: "textTdTableLeft",
					},
					{ text: eventName, style: "textTdTableLeft" },
					{ text: item.rule, style: "textTdTableLeft" },
					{ text: item.vehicles, style: "textTdTableLeft" },
					{ text: eventDetail, style: "textTdTableLeft" },
				];
			}),
		},
		header: {
			mainTitle: "REPORTE DE EVENTOS",
			userName: "Usuario de Prueba",
			issueDate: new Date(),
			filterBy: null,
		},
	});
