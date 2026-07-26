import PdfKit from "pdfkit";
import { cmToPoints } from "../common/cm-to-points.js";
import { cwd } from "node:process";
import path from "node:path";

/**
 * @typedef {"Roboto"|"Inter"} Font
 */

/**
 * @param {number} value
 * @param {string} unit
 * @returns {number}
 */
const getUnitConversion = (value, unit) => {
	if (unit === "cm") {
		return cmToPoints(value);
	}

	return value;
};

// export const buildDocument =
// 	(...fns) =>
// 	/** @param { typeof PdfKit} initialValue */
// 	(initialDocument) =>
// 		fns.reduce((acc, fn) => fn(acc), initialDocument);

/**
 * @param {object} request
 * @param {"LETTER"|"A4"|"EXECUTIVE"|"LEGAL"|"TABLOID"|"A4"} request.pageSize
 * @param {{top:number, bottom:number, left:number, right:number, unit:"cm"|"pt"}} request.pageMargins
 * @param {boolean} request.bufferPages
 * @param {import('express').Response} request.res
 * @param {"inline"|"attachment"} request.disposition
 * @param {string} request.fileName
 * @param {Font[]} request.fonts
 */
export const initDocument = ({
	pageSize = "LETTER",
	pageMargins = {},
	bufferPages = false,
	res,
	disposition = "inline",
	fileName = "example",
	fonts = [],
}) => {
	const { top = 0, bottom = 0, left = 0, right = 0, unit = "cm" } = pageMargins;

	const document = new PdfKit({
		bufferPages,
		size: pageSize,
		margins: {
			top: getUnitConversion(top, unit),
			bottom: getUnitConversion(bottom, unit),
			left: getUnitConversion(left, unit),
			right: getUnitConversion(right, unit),
		},
	});

	loadFonts({ fonts, document });

	res.setHeader("Content-Type", "application/pdf");
	res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}.pdf"`);

	document.pipe(res);

	return document;
};

const getDefaultFont = () => ({
	regular: "Times-Roman",
	bold: "Times-Bold",
	italic: "Times-Italic",
	boldItalic: "Times-BoldItalic",
});

/**
 * @param {Font} fontName
 */
export const getFont = (fontName) => {
	switch (fontName) {
		case "Roboto":
			return {
				regular: "Roboto",
				bold: "Roboto-bold",
				italic: "Roboto-italic",
				boldItalic: "Roboto-bold-italic",
			};
		case "Inter":
			return {
				regular: "Inter",
				bold: "Inter-bold",
				italic: "Inter-italic",
				boldItalic: "Inter-bold-italic",
			};
		default:
			return getDefaultFont();
	}
};

// export const finalizeBuild = () => (document) => {
// 	document.end();
// 	return document;
// };

/**
 * @param {object} request
 * @param {Font[]} request.fonts
 * @param {typeof PdfKit} request.document
 */
const loadFonts = ({ fonts, document }) => {
	if (fonts.length <= 0) return;

	const fontPath = path.join(cwd(), "src/core/pdf/fonts");

	for (const fontName of fonts) {
		switch (fontName) {
			case "Roboto": {
				const robotoFontPath = path.join(fontPath, "roboto");

				document.registerFont("Roboto", `${robotoFontPath}/Roboto-Regular.ttf`);
				document.registerFont("Roboto-bold", `${robotoFontPath}/Roboto-Bold.ttf`);
				document.registerFont(
					"Roboto-bold-italic",
					`${robotoFontPath}/Roboto-BoldItalic.ttf`,
				);
				document.registerFont("Roboto-italic", `${robotoFontPath}/Roboto-Italic.ttf`);
				break;
			}
			case "Inter": {
				const interFontPath = path.join(fontPath, "inter");

				document.registerFont("Inter", `${interFontPath}/Inter_18pt-Regular.ttf`);
				document.registerFont("Inter-bold", `${interFontPath}/Inter_18pt-Bold.ttf`);
				document.registerFont(
					"Inter-bold-italic",
					`${interFontPath}/Inter_18pt-BoldItalic.ttf`,
				);
				document.registerFont("Inter-italic", `${interFontPath}/Inter_18pt-Italic.ttf`);
				break;
			}
			default: {
				throw new Error(`Unsupported font: ${fontName}`);
			}
		}
	}
};
