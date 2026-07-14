import pdfmake from "pdfmake";
import { logger } from "../common/logger.js";
import path from "node:path";
import { cwd } from "node:process";

/** @param {import('express').Response} res */
export const pdfGenerateExample = async (res) => {
	const fontPath = path.resolve(cwd(), "src/core/pdf/fonts");

	const fonts = {
		Roboto: {
			normal: `${fontPath}/Roboto-Regular.ttf`,
			bold: `${fontPath}/Roboto-Medium.ttf`,
			italics: `${fontPath}/Roboto-Italic.ttf`,
			bolditalics: `${fontPath}/Roboto-MediumItalic.ttf`,
		},
	};

	try {
		pdfmake.fonts = fonts;

		/** @type {import('pdfmake/interfaces').TDocumentDefinitions} */
		const docDefinition = {
			content: "Hello, this is a PDF generated using pdfmake!",
		};

		const pdfDoc = pdfmake.createPdf(docDefinition);

		const pdfStream = await pdfDoc.getStream();

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", 'attachment; filename="example.pdf"');

		pdfStream.pipe(res, {
			end: true,
		});

		pdfStream.end();

		pdfStream.on("end", () => {
			console.log("Streaming finalized");
		});

		pdfStream.on("error", (err) => {
			logger.error(`[PDF] Error streaming PDF:`, err);
			res.status(500).send("Error streaming PDF");
		});
	} catch (error) {
		logger.error(`[PDF] Error generating PDF:`, error);
		res.status(500).send("Error generating PDF");
	}
};
