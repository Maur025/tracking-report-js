import { Readable } from "node:stream";
import { getFormatDate } from "../common/get-format-date.js";
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

	const calculateColumnXPositions = (columnWidths = []) => {
		const startX = document.page.margins.left;
		const columnX = [startX];

		let xPosition = startX;

		for (const width of columnWidths) {
			columnX.push(xPosition + width);
			xPosition += width;
		}

		return { columnX, startX };
	};

	const addTableHeader = ({ headers = [], columnX = [], yPosition = 0 }) => {
		document.fontSize(10);

		for (let i = 0; i < headers.length; i++) {
			const label = headers[i].text || "";
			const xPosition = columnX[i] || document.page.margins.left;

			document.text(label, xPosition, yPosition);
		}
	};

	const addHorizontalLine = ({ startXPosition, yPosition, endXPosition }) => {
		const endX = endXPosition || document.page.width - document.page.margins.right;

		document.moveTo(startXPosition, yPosition).lineTo(endX, yPosition).stroke();
	};

	return {
		doc: document,
		setMainTitle,
		buildHeader,
		calculateColumnXPositions,
		addTableHeader,
		addHorizontalLine,
	};
};

/**
 * @typedef {object} HeaderObject
 * @property {string} userName
 * @property {Date} issueDate
 * @property {string} filterBy
 */

/**
 * @typedef {object} TableRowObject
 * @property {string} text
 * @property {number} fontSize
 */

/**
 * @typedef {object} TableObject
 * @property {number[]} columnWidths
 * @property {TableRowObject[]} headers
 * @property {(item:object, index: number) => TableRowObject[]} body
 */

/**
 * @param {object} request
 * @param {Function} request.dataSource
 * @param {string} request.mainTitle
 * @param {HeaderObject} request.header
 * @param {TableObject} request.table
 */
export const reportTable =
	({ dataSource, mainTitle = "REPORT EXAMPLE", header = {}, table = {} }) =>
	/**@param {typeof import('pdfkit')} document */
	(document) => {
		const { userName = "Sin Nombre" } = header;
		const { columnWidths = [], headers = [], body = () => [] } = table;

		const {
			doc,
			setMainTitle,
			buildHeader,
			calculateColumnXPositions,
			addTableHeader,
			addHorizontalLine,
		} = reportTableTemplate(document);

		setMainTitle(mainTitle);
		buildHeader({ userName });

		doc.moveDown(2);

		const { columnX, startX } = calculateColumnXPositions(columnWidths);

		let currentY = doc.y;

		addTableHeader({ headers, columnX, yPosition: currentY });

		currentY += 15;

		addHorizontalLine({ startXPosition: startX, yPosition: currentY });

		currentY += 10;

		const dataStream = Readable.from(dataSource());
		let index = 1;

		const cellPaddingHorizontal = 4;

		dataStream.on("data", (item) => {
			const values = body(item, index);
			let maxCellHeight = 0;

			for (let i = 0; i < columnWidths.length; i++) {
				const rowValue = values[i].text || "";
				const rowFontSize = values[i].fontSize || 9;

				doc.fontSize(rowFontSize);

				const usableWidth = columnWidths[i] - cellPaddingHorizontal * 2;

				const cellHeight = doc.heightOfString(rowValue, { width: usableWidth });

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
				const rowValue = values[i].text || "";
				const rowFontSize = values[i].fontSize || 9;

				const usableWidth = columnWidths[i] - cellPaddingHorizontal * 2;

				doc.fontSize(rowFontSize).text(
					rowValue,
					columnX[i] + cellPaddingHorizontal,
					currentY,
					{
						width: usableWidth,
						lineBreak: true,
					},
				);
			}

			currentY += maxCellHeight + 6;

			index++;
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
