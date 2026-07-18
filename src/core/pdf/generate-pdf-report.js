import path from "node:path";
import { cwd } from "node:process";
import pdfMake from "pdfmake";
import { logger } from "../common/logger.js";
import { getFormatDate } from "../common/get-format-date.js";
import { cmToPoints } from "../common/cm-to-points.js";

export const generatePdfReport = ({ res }) => {
	const fontPath = path.resolve(cwd(), "src/core/pdf/fonts");

	const fonts = {
		Roboto: {
			normal: `${fontPath}/Roboto-Regular.ttf`,
			bold: `${fontPath}/Roboto-Medium.ttf`,
			italics: `${fontPath}/Roboto-Italic.ttf`,
			bolditalics: `${fontPath}/Roboto-MediumItalic.ttf`,
		},
	};

	const setPageSize = (pageSize) => (document) => ({ ...document, pageSize });

	const setStyles = (styles) => (document) => {
		return { ...document, styles };
	};

	const setMargins =
		({ left, top, right, bottom, x, y, all }) =>
		(document) => {
			let pageMargins;

			if (
				top !== undefined &&
				right !== undefined &&
				bottom !== undefined &&
				left !== undefined
			) {
				pageMargins = [
					cmToPoints(left),
					cmToPoints(top),
					cmToPoints(right),
					cmToPoints(bottom),
				];
			}

			if (x !== undefined && y !== undefined) {
				pageMargins = [cmToPoints(x), cmToPoints(y)];
			}

			if (all !== undefined) {
				pageMargins = cmToPoints(all);
			}

			return { ...document, pageMargins };
		};

	const setFooter = (footerFn) => (document) => ({ ...document, footer: footerFn });

	const getCurrentDate = () => {
		const now = new Date();
		return getFormatDate({ date: now });
	};

	const buildDocumentDefinition =
		(...fns) =>
		(initialValue) =>
			fns.reduce((acc, fn) => fn(acc), initialValue);

	const generate = async (documentDefinition) => {
		try {
			pdfMake.fonts = fonts;

			const pdfDocument = pdfMake.createPdf(documentDefinition);

			return pdfDocument.getStream();
		} catch (err) {
			logger.error(`[PDF] Error generating PDF:`, err);
			return null;
		}
	};

	const responseStream = async (pdfStream) => {
		if (!pdfStream) {
			return res.status(500).send("Error generating PDF");
		}

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", 'attachment; filename="example.pdf"');

		try {
			pdfStream.pipe(res, {
				end: true,
			});

			pdfStream.end();
		} catch (error) {
			logger.error(`[PDF] Error streaming PDF:`, error);
			return res.status(500).send("Error streaming PDF");
		}
	};

	return {
		generate,
		responseStream,
		cmToPoints,
		getCurrentDate,
		getFormatDate,
		setStyles,
		setMargins,
		setPageSize,
		setFooter,
		buildDocumentDefinition,
	};
};
