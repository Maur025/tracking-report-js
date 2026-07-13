import { describe, expect, test } from "vitest";
import { createPdfTemplate, generatePdf } from "../../../src/core/pdf/generate-pdf.js";

describe("PDF template", () => {
	test("builds a reusable document definition", () => {
		const template = createPdfTemplate({
			brand: {
				companyName: "Acme Corp",
				reportTitle: "Reporte base",
			},
		});

		const documentDefinition = template.buildDocument({
			title: "Ventas mensuales",
			sectionTitle: "Detalle",
			rows: [{ producto: "Laptop", cantidad: 2 }],
		});

		expect(documentDefinition.pageMargins).toEqual([32, 118, 32, 60]);
		expect(documentDefinition.content).toHaveLength(2);
		expect(documentDefinition.header).toBeTypeOf("function");
		expect(documentDefinition.footer).toBeTypeOf("function");
		expect(documentDefinition.content[1].table.body[0][0].text).toBe("Producto");
	});

	test("generates a valid pdf buffer", async () => {
		const buffer = await generatePdf({
			data: {
				title: "Demo",
				rows: [
					{ nombre: "A", cantidad: 1 },
					{ nombre: "B", cantidad: 2 },
				],
				columns: [
					{ field: "nombre", label: "Nombre", width: "*" },
					{ field: "cantidad", label: "Cantidad", width: 80, alignment: "right" },
				],
			},
		});

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
	});
});
