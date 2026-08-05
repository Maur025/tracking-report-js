import { getFormatDate } from "../common/date/get-format-date.js";
import { getFont } from "./generate-pdf.js";

/** @param {typeof import('pdfkit')} document */
export const reportTableTemplate = (document) => {
	const LOGO_WIDTH = 120;

	const buildHeader = ({
		userName = "Sin Nombre",
		issueDate = null,
		filterBy = null,
		enterpriseName = null,
		enterpriseLogo = null,
	}) => {
		if (enterpriseLogo) {
			document.image(enterpriseLogo, document.page.margins.left, document.page.margins.top, {
				height: 65,
			});
		}

		const xPosition = document.page.margins.left + (enterpriseLogo ? LOGO_WIDTH : 0);

		if (enterpriseName) {
			document
				.fontSize(12)
				.text(`${enterpriseName}`, xPosition, document.page.margins.top + 16);
		}

		document.font(getFont("Inter").regular).fontSize(11);

		if (userName) {
			document.text(`Usuario: ${userName}`);
		}
		if (filterBy) {
			document.text(`Filtros: ${filterBy}`);
		}

		document.text(
			`Fecha de emisión: ${issueDate ? getFormatDate({ date: issueDate }) : getFormatDate({ date: new Date() })}`,
		);

		document.fontSize(10).restore();
	};

	const setMainTitle = (title, hasEnterpriseLogo) => {
		const xPosition = document.page.margins.left + (hasEnterpriseLogo ? LOGO_WIDTH : 0);
		document
			.font(getFont("Inter").bold)
			.fontSize(14)
			.text(title, xPosition, document.page.margins.top);
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
		document.font(getFont("Inter").bold).fontSize(10);

		for (let i = 0; i < headers.length; i++) {
			const label = headers[i].text || "";
			const xPosition = columnX[i] || document.page.margins.left;

			document.text(label, xPosition, yPosition);
		}

		document.font(getFont("Inter").regular);
	};

	const addHorizontalLine = ({ startXPosition, yPosition, endXPosition }) => {
		const endX = endXPosition || document.page.width - document.page.margins.right;

		document.moveTo(startXPosition, yPosition).lineTo(endX, yPosition).stroke();
	};

	const addFooter = ({ footerHeight, pageNumber, paddingTop }) => {
		const yPosition =
			document.page.height - document.page.margins.bottom - footerHeight + paddingTop;

		const currentDate = getFormatDate({ date: new Date() });

		document
			.fontSize(8)
			.text(`Página ${pageNumber}`, document.page.margins.left, yPosition, { width: 150 })
			.text(
				`Fecha de impresión: ${currentDate}`,
				document.page.width - document.page.margins.right - 150,
				yPosition,
				{
					width: 150,
				},
			);
	};

	return {
		doc: document,
		setMainTitle,
		buildHeader,
		calculateColumnXPositions,
		addTableHeader,
		addHorizontalLine,
		addFooter,
	};
};
