import excelJs from "exceljs";

/**
 * @param {object} request
 * @param {import("express").Response} request.res
 */
export const excelExample = async ({ res }) => {
	res.setHeader(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	);
	res.setHeader("content-disposition", "attachment; filename=example.xlsx");

	const workbook = new excelJs.stream.xlsx.WorkbookWriter({
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

	const worksheet = workbook.addWorksheet("Example Sheet");

	worksheet.columns = [
		{ header: "Nro", key: "nro", width: 10 },
		{
			header: "Nombre",
			key: "nombre",
			width: 30,
		},
	];

	for (let i = 0; i < 1000; i++) {
		worksheet
			.addRow({
				nro: i + 1,
				nombre: `Nombre ${i + 1}`,
			})
			.commit();
	}

	await worksheet.commit();
	await workbook.commit();
};
