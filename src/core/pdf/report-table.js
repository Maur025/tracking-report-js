import { Readable } from "node:stream";
import { logger } from "../common/logger.js";
import { reportTableTemplate } from "./report-table-template.js";

/**
 * @typedef {object} HeaderObject
 * @property {string} userName
 * @property {Date} issueDate
 * @property {string} filterBy
 * @property {string} enterpriseName
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
 * @param {string} request.zoneId
 */
export const reportTable =
	({ dataSource, mainTitle = "REPORT EXAMPLE", header = {}, table = {}, zoneId }) =>
	/**@param {typeof import('pdfkit')} document */
	(document) => {
		const { columnWidths = [], headers: columnHeaders = [], body = () => [] } = table;

		const {
			doc,
			setMainTitle,
			buildHeader,
			calculateColumnXPositions,
			addTableHeader,
			addHorizontalLine,
			addFooter,
		} = reportTableTemplate(document);

		let pageNumber = 1;

		setMainTitle(mainTitle, !!header.enterpriseLogo);
		buildHeader({ ...header, zoneId });

		doc.moveDown(2);

		const { columnX, startX } = calculateColumnXPositions(columnWidths);

		let currentY = doc.y;

		addTableHeader({ headers: columnHeaders, columnX, yPosition: currentY });

		currentY += 15;

		addHorizontalLine({ startXPosition: startX, yPosition: currentY });

		currentY += 10;

		const dataStream = Readable.from(dataSource());
		let index = 1;

		const cellPaddingHorizontal = 4;
		const footerHeight = 30;

		addFooter({ footerHeight, pageNumber, paddingTop: 10, zoneId });

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

			if (currentY + maxCellHeight > pageHeight - bottomMargin - footerHeight) {
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

		doc.on("pageAdded", () => {
			pageNumber++;

			addFooter({ footerHeight, pageNumber, paddingTop: 10, zoneId });
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
