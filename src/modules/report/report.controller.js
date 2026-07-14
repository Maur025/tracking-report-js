import generatePdf from "../../core/pdf/generate-pdf.js";
import { pdfGenerateExample } from "../../core/pdf/pdf-make-example-v3.js";

export class ReportController {
	#resource = "reports";

	constructor() {}

	/** @param {import('express').Application} app*/
	registerRoutes(app, basePath) {
		app.get(`${basePath}/${this.#resource}`, (req, res) => this.#handleDefaultGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleDefaultGet(req, res) {
		console.log("ESTA EN REPORT CONTROLLER");

		// await pdfMakeExample(res);

		// await pdfGenerateExample(res);

		const pdfStream = await generatePdf({
			data: {},
			template: {},
			output: "stream",
		});

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
			console.info(`[PDF] Error streaming PDF:`, err);
			res.status(500).send("Error streaming PDF");
		});
	}
}
