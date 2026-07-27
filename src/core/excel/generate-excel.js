import ExcelJS from "exceljs";

/**
 * @param {{
 *  res: import('express').Response
 *  disposition: "inline"|"attachment",
 *  fileName: string
 * }} request
 */
export const generateExcel = ({ res, disposition = "attachment", fileName = "report" }) => {
	res.setHeader(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	);
	res.setHeader("content-disposition", `${disposition}; filename=${fileName}.xlsx`);

	const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
		stream: res,
		useStyles: true,
		useSharedStrings: true,
	});

	workbook.views = [
		{
			x: 0,
			y: 0,
			width: 10000,
			height: 20000,
			firstSheet: 0,
			activeTab: 1,
			visibility: "visible",
		},
	];

	const closeWorkbook = async () => {
		await workbook.commit();
	};

	return {
		workbook,
		closeWorkbook,
	};
};
