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
		{ key: "nro", width: 10, style: { font: { name: "Inter", size: 11 } } },
		{
			key: "nombre",
			width: 30,
			style: { font: { name: "Inter", size: 11 } },
		},
	];

	const mainTitle = worksheet.addRow(["REPORTE DE EVENTOS"], "i");
	mainTitle.font = { name: "Inter", size: 14, bold: true };
	mainTitle.commit();

	const enterpriseName = worksheet.addRow(["Empresa de prueba"], "i");
	enterpriseName.font = { name: "Inter", size: 12, bold: true };
	enterpriseName.commit();

	worksheet.addRow(["Usuario: John Doe"], "i").commit();
	worksheet.addRow(["Filtros: evento combustible"], "i").commit();
	worksheet.addRow(["Fecha de emisión: 27/07/2026, 11:20"], "i").commit();

	worksheet.addRow([]).commit();
	const tableHeaders = worksheet.addRow({ nro: "Nro", nombre: "Nombre" }, "i");
	tableHeaders.font = { name: "Inter", size: 11, bold: true };
	tableHeaders.commit();

	for (let i = 0; i < 1000; i++) {
		worksheet
			.addRow(
				{
					nro: i + 1,
					nombre: `Nombre ${i + 1}`,
				},
				"i",
			)
			.commit();
	}

	await worksheet.commit();
	await workbook.commit();
};
