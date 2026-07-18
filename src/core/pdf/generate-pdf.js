import PdfKit from "pdfkit";
import { cmToPoints } from "../common/cm-to-points.js";

const getUnitConversion = (value, unit) => {
	if (unit === "cm") {
		return cmToPoints(value);
	}

	return value;
};

export const buildDocument =
	(...fns) =>
	/** @param { typeof PdfKit} initialValue */
	(initialDocument) =>
		fns.reduce((acc, fn) => fn(acc), initialDocument);

export const initDocument = ({
	pageSize = "LETTER",
	pageMargins = {},
	bufferPages = false,
	res,
	disposition = "inline",
	fileName = "example",
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

	res.setHeader("Content-Type", "application/pdf");
	res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}.pdf"`);

	document.pipe(res);

	return document;
};

export const finalizeBuild = () => (document) => {
	document.end();
	return document;
};
