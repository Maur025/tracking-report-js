import { getFormatDate } from "../common/get-format-date.js";
import { generatePdfReport } from "./generate-pdf-report.js";

export const reportTableTemplate = async ({ res, table, header }) => {
	const { columnWidths = [], columns = [], rowData = [] } = table ?? {};

	const {
		mainTitle = "EXAMPLE REPORT",
		userName = "Sin Nombre",
		issueDate = new Date(),
		filterBy = null,
	} = header ?? {};

	const {
		buildDocumentDefinition,
		setPageSize,
		setMargins,
		setStyles,
		generate,
		responseStream,
		cmToPoints,
		getCurrentDate,
		setFooter,
	} = generatePdfReport({ res });

	const footer = (currentPage, pageCount) => ({
		columns: [
			{
				text: `Pagina ${currentPage} de ${pageCount}`,
				alignment: "left",
				margin: [cmToPoints(2), 0, 0, 0],
				style: "footerText",
			},
			{
				text: "Tracking - GPS",
				alignment: "center",
				style: "footerText",
			},
			{
				text: `Fecha y Hora de impresión: ${getCurrentDate()}`,
				alignment: "right",
				margin: [0, 0, cmToPoints(1), 0],
				style: "footerText",
			},
		],
	});

	const createDocument = buildDocumentDefinition(
		setPageSize("LETTER"),
		setMargins({ left: 2, top: 2, right: 1, bottom: 2 }),
		setStyles({
			tableHeader: { bold: true, fontSize: 11, color: "black" },
			textTdTableLeft: { fontSize: 9, alignment: "left" },
			mainTitle: {
				fontSize: 14,
				margin: [40, 0, 0, 0],
				bold: true,
			},
			secondaryTitle: {
				fontSize: 12,
				margin: [40, 0, 0, 0],
				bold: false,
			},
			footerText: {
				fontSize: 7,
				bold: true,
			},
		}),
		setFooter(footer),
	);

	const buildHeaderDocument = () => {
		const documentHeader = [];
		if (mainTitle) {
			documentHeader.push({
				text: mainTitle,
				style: "mainTitle",
			});
		}

		if (userName) {
			documentHeader.push({
				text: `Usuario: ${userName}`,
				style: "secondaryTitle",
			});
		}

		if (filterBy) {
			documentHeader.push({
				text: `Por fechas del ${filterBy.startDate} al ${filterBy.endDate}`,
				style: "secondaryTitle",
			});
		}

		if (issueDate) {
			documentHeader.push({
				text: `Fecha emisión: ${getFormatDate({ date: issueDate })}`,
				style: "secondaryTitle",
			});
		}

		return documentHeader;
	};

	const documentDefinition = createDocument({
		content: [
			{
				columns: [
					{
						text: "Logo",
					},
					buildHeaderDocument(),
				],
				margin: [0, 0, 0, 20],
			},
			{
				table: {
					headerRows: 1,
					widths: columnWidths,
					body: [columns, ...rowData],
				},
			},
		],
	});

	const pdfStream = await generate(documentDefinition);

	await responseStream(pdfStream);
};
