import { Readable } from "node:stream";
import { logger } from "../common/logger.js";
import { reportTableTemplate } from "./report-table-template.js";

/**
 * @typedef {{
 *  value:object,
 *  fontSize:number,
 *  bold:boolean,
 *  width:number
 * }} ColumnParam
 */

/**
 * @param {{
 * dataSource: () => AsyncGenerator<any, void, unknown>;
 * mainTitle: string;
 * header: {
 *   userName: ColumnParam;
 *   issueDate: ColumnParam;
 *   filterBy: ColumnParam;
 *   enterpriseName: ColumnParam;
 * };
 * table: {
 *  headers: ColumnParam[];
 *  body: (item: object, index: number) => ColumnParam[];
 * };
 * font: "Inter"|"Arial";
 * }} request
 */
export const reportTable =
	({ dataSource, mainTitle = "REPORT TABLE EXAMPLE", header = {}, table = {}, font }) =>
	/**
	 * @param {{
	 *  workbook:import('exceljs').stream.xlsx.WorkbookWriter;
	 *  closeWorkbook: () => Promise<void>;
	 * }} req
	 * */
	async ({ workbook, closeWorkbook }) => {
		const { headers = [], body = () => [] } = table;
		const { addSheet, addColumnDefinitions, addHeader, addRow } = reportTableTemplate({
			workbook,
		});

		const tableSheet = addSheet(mainTitle);
		addColumnDefinitions({ headers, font, defaultSize: 11, sheet: tableSheet });

		addHeader({ ...header, sheet: tableSheet, mainTitle });

		addRow({ sheet: tableSheet, columns: [] });

		addRow({
			sheet: tableSheet,
			columns: headers,
			styles: true,
			rowStyle: { bold: true, name: font },
		});

		const dataStream = Readable.from(dataSource());

		let index = 1;

		const endStream = async () => {
			await tableSheet.commit();
			await closeWorkbook();
		};

		dataStream.on("data", (item) => {
			addRow({ sheet: tableSheet, columns: body(item, index) });

			index++;
		});

		dataStream.on("end", async () => {
			await endStream();
		});

		dataStream.on("error", async (err) => {
			logger.error(`Error generating report: ${err.message}`);
			await endStream();
		});
	};
