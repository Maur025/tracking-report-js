import { getFormatDate } from "../common/get-format-date.js";

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
 *  workbook:import('exceljs').stream.xlsx.WorkbookWriter;
 * }} request
 */
export const reportTableTemplate = ({ workbook }) => {
	const addSheet = (name = null) => {
		if (!name) {
			throw new Error("Sheet name is required");
		}

		return workbook.addWorksheet(name);
	};

	/**
	 * @param {{
	 *  headers: ColumnParam[]
	 *  font: "Inter"|"Arial"
	 *  sheet: import('exceljs').Worksheet
	 *  defaultSize: number
	 * }} request
	 */
	const addColumnDefinitions = ({ headers, font, defaultSize, sheet }) => {
		const columnDefinitions = headers.map((header) => ({
			key: normalizedName(header.value),
			width: header.width || 20,
			style: {
				font: { name: font, size: header.fontSize || defaultSize || 8 },
				bold: header.bold || false,
			},
		}));

		sheet.columns = columnDefinitions;
	};

	/**
	 * @param {{
	 *  sheet: import('exceljs').Worksheet,
	 *  mainTitle: string,
	 *  userName: ColumnParam,
	 *  issueDate: ColumnParam,
	 *  filterBy: ColumnParam,
	 *  enterpriseName: ColumnParam,
	 *  enterpriseLogo: ColumnParam
	 * }} request
	 */
	const addHeader = ({
		sheet,
		mainTitle,
		userName = { value: "Sin nombre" },
		issueDate = null,
		filterBy = null,
		enterpriseName = null,
		// eslint-disable-next-line no-unused-vars
		enterpriseLogo = null,
	}) => {
		addRow({
			sheet,
			columns: [{ value: mainTitle, fontSize: 14, bold: true }],
			styles: true,
		});

		if (enterpriseName && enterpriseName.value) {
			addRow({ sheet, columns: [enterpriseName], styles: true });
		}

		if (userName && userName.value) {
			addRow({
				sheet,
				columns: [{ value: "Usuario:", bold: true }, userName],
				styles: true,
			});
		}

		if (filterBy && filterBy.value) {
			addRow({ sheet, columns: [{ value: "Filtros:", bold: true }, filterBy], styles: true });
		}

		addRow({
			sheet,
			columns: [
				{ value: "Fecha de emisión:", bold: true },
				{
					value:
						issueDate && issueDate.value
							? getFormatDate({ date: issueDate.value })
							: getFormatDate({ date: new Date() }),
				},
			],
			styles: true,
		});
	};

	/**
	 * @param {{
	 *  sheet: import('exceljs').Worksheet
	 *  columns: ColumnParam[]
	 *  styles: boolean
	 *  rowStyle: import('exceljs').Font | null
	 * }} request
	 */
	const addRow = ({ sheet, columns, styles = false, rowStyle = null }) => {
		const rowSheet = sheet.addRow(
			columns.map((column) => column.value),
			"i",
		);

		if (!styles) {
			rowSheet.commit();
			return;
		}

		if (rowStyle) {
			rowSheet.font = rowStyle;
		} else {
			columns.forEach((column, index) => {
				if (!column.fontSize && (column.bold === undefined || column.bold === null)) return;

				const cell = rowSheet.getCell(index + 1);

				const fontValues = {
					name: cell.font.name,
				};

				if (column.bold !== undefined && column.bold !== null) {
					fontValues.bold = column.bold;
				}

				if (column.fontSize) {
					fontValues.size = column.fontSize;
				}

				cell.font = fontValues;
			});
		}

		rowSheet.commit();
	};

	/** @param {string} value */
	const normalizedName = (value) => {
		return value.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
	};

	return { addSheet, addColumnDefinitions, normalizedName, addRow, addHeader };
};
