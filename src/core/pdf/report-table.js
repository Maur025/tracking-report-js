import { Readable } from "node:stream";
import { getFormatDate } from "../common/get-format-date.js";
import { getEventValues } from "../../modules/report/common/event-report-common.js";
import { logger } from "../common/logger.js";

/** @param {typeof import('pdfkit')} document */
const reportTableTemplate = (document) => {
	const buildHeader = ({ userName = "Sin Nombre", issueDate = null, filterBy = null }) => {
		document.fontSize(12);
		if (userName) {
			document.text(`Usuario: ${userName}`);
		}
		if (filterBy) {
			document.text(filterBy);
		}

		document.text(
			`Fecha de emisión: ${issueDate ? getFormatDate({ date: issueDate }) : getFormatDate({ date: new Date() })}`,
		);

		document.fontSize(10).restore();
	};

	const setMainTitle = (title) => {
		document.fontSize(14).text(
			title,
			// document.page.margins.left + 100,
			// document.page.margins.top
		);
	};

	return { doc: document, setMainTitle, buildHeader };
};

export const reportTable = (dataSource) => (document) => {
	const { doc, setMainTitle, buildHeader } = reportTableTemplate(document);

	setMainTitle("REPORTE DE EVENTOS");
	buildHeader({ userName: "Mauro" });

	doc.moveDown(2);

	const startX = doc.page.margins.left;
	let currentY = doc.y;

	const columnWidths = [30, 80, 80, 100, 96, 100];

	let xPosition = startX;
	const columnX = [startX];

	for (const width of columnWidths) {
		columnX.push(xPosition + width);
		xPosition += width;
	}

	doc.fontSize(10)
		.text("Nro", columnX[0], currentY)
		.text("Fecha", columnX[1], currentY)
		.text("Tipo", columnX[2], currentY)
		.text("Regla", columnX[3], currentY)
		.text("Vehículo", columnX[4], currentY)
		.text("Evento", columnX[5], currentY);

	currentY += 15;
	doc.moveTo(startX, currentY)
		.lineTo(doc.page.width - doc.page.margins.right, currentY)
		.stroke();

	currentY += 10;

	const dataStream = Readable.from(dataSource());
	let index = 1;

	const cellPaddingHorizontal = 4;

	dataStream.on("data", (item) => {
		const { eventName, eventDetail } = getEventValues(item);
		const formattedDate = getFormatDate({ date: new Date(item.date) });

		const values = [
			index++ || "",
			formattedDate || "",
			eventName || "",
			item.rule || "",
			item.vehicles || "",
			eventDetail || "",
		];

		doc.fontSize(9);
		let maxCellHeight = 0;

		for (let i = 0; i < columnWidths.length; i++) {
			const usableWidth = columnWidths[i] - cellPaddingHorizontal * 2;

			const cellHeight = doc.heightOfString(values[i], { width: usableWidth });

			if (cellHeight > maxCellHeight) {
				maxCellHeight = cellHeight;
			}
		}

		const bottomMargin = doc.page.margins.bottom;
		const pageHeight = doc.page.height;

		if (currentY + maxCellHeight > pageHeight - bottomMargin) {
			doc.addPage();
			currentY = doc.page.margins.top;
		}

		for (let i = 0; i < columnWidths.length; i++) {
			const usableWidth = columnWidths[i] - cellPaddingHorizontal * 2;

			doc.text(values[i], columnX[i] + cellPaddingHorizontal, currentY, {
				width: usableWidth,
				lineBreak: true,
			});
		}

		currentY += maxCellHeight + 6;
	});

	dataStream.on("end", () => {
		doc.end();
	});

	dataStream.on("error", (err) => {
		logger.error(`[PDF] Error generating PDF report:`, err);
		doc.end();
	});

	return doc;
};
