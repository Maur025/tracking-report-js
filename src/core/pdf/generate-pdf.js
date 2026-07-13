import { createRequire } from "node:module";
import { dirname, isAbsolute, resolve } from "node:path";
import pdfmake from "pdfmake";

const require = createRequire(import.meta.url);
const pdfmakePackagePath = require.resolve("pdfmake/package.json");
const pdfmakePackageDir = dirname(pdfmakePackagePath);
const robotoFontDir = resolve(pdfmakePackageDir, "fonts/Roboto");

const fontDescriptors = {
	Roboto: {
		normal: resolve(robotoFontDir, "Roboto-Regular.ttf"),
		bold: resolve(robotoFontDir, "Roboto-Medium.ttf"),
		italics: resolve(robotoFontDir, "Roboto-Italic.ttf"),
		bolditalics: resolve(robotoFontDir, "Roboto-MediumItalic.ttf"),
	},
};

const defaultTheme = {
	accent: "#0f766e",
	accentSoft: "#ccfbf1",
	border: "#d9e2ec",
	muted: "#667085",
	surface: "#f8fafc",
	stripe: "#eef6f7",
	text: "#102a43",
	textOnAccent: "#ffffff",
};

const defaultBrand = {
	companyName: "Tu empresa",
	companyTagline: "Template de reportes PDF",
	reportTitle: "Reporte demo",
	logo: null,
	logoLabel: "LOGO",
	footerNote: "Generado automáticamente",
};

const defaultLocale = "es-ES";

const normalizePath = (value) => value.replace(/\\/g, "/");

const getEngine = () => Object.create(pdfmake);

const createAccessPolicy = ({ allowedLocalPaths = [], logoPath = null }) => {
	const allowedPrefixes = [robotoFontDir, ...allowedLocalPaths]
		.filter(Boolean)
		.map(normalizePath);

	if (logoPath && typeof logoPath === "string" && !logoPath.startsWith("data:")) {
		allowedPrefixes.push(
			normalizePath(isAbsolute(logoPath) ? logoPath : resolve(process.cwd(), logoPath)),
		);
		allowedPrefixes.push(
			normalizePath(
				dirname(isAbsolute(logoPath) ? logoPath : resolve(process.cwd(), logoPath)),
			),
		);
	}

	return (path) => {
		if (typeof path !== "string") {
			return false;
		}

		if (path.startsWith("data:")) {
			return true;
		}

		const normalizedPath = normalizePath(path);
		return allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix));
	};
};

const formatValue = ({ value, column, locale, context }) => {
	if (typeof column?.formatter === "function") {
		return column.formatter(value, context);
	}

	if (typeof column?.format === "function") {
		return column.format(value, context);
	}

	if (value === null || value === undefined || value === "") {
		return "—";
	}

	if (value instanceof Date) {
		return new Intl.DateTimeFormat(locale, {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(value);
	}

	if (typeof value === "number") {
		return new Intl.NumberFormat(locale).format(value);
	}

	if (typeof value === "boolean") {
		return value ? "Sí" : "No";
	}

	return String(value);
};

const titleCase = (value) =>
	String(value)
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());

const resolveColumns = ({ columns, rows }) => {
	if (Array.isArray(columns) && columns.length > 0) {
		return columns;
	}

	const firstRow = Array.isArray(rows)
		? rows.find((row) => row && typeof row === "object" && !Array.isArray(row))
		: null;
	if (!firstRow) {
		return [];
	}

	return Object.keys(firstRow).map((key) => ({
		field: key,
		label: titleCase(key),
	}));
};

const resolveCellValue = ({ row, column, rowIndex, data, locale }) => {
	if (Array.isArray(row)) {
		const cellValue = row[column.index ?? 0];
		return formatValue({
			value: cellValue,
			column,
			locale,
			context: { row, column, rowIndex, data },
		});
	}

	const field = column.field ?? column.key ?? column.value ?? column.label;
	const cellValue = field ? row?.[field] : row;
	return formatValue({
		value: cellValue,
		column,
		locale,
		context: { row, column, rowIndex, data },
	});
};

const resolveLogo = (logo) => {
	if (!logo) {
		return null;
	}

	if (typeof logo === "string") {
		return { image: logo, fit: [96, 48] };
	}

	if (typeof logo === "object") {
		const image = logo.image ?? logo.src;
		if (!image) {
			return null;
		}

		return {
			image,
			fit: logo.fit ?? [96, 48],
			width: logo.width,
			height: logo.height,
			alignment: logo.alignment ?? "center",
			margin: logo.margin,
		};
	}

	return null;
};

const buildHeader = ({ brand, title, subtitle, theme, logoNode, locale, generatedAt }) => {
	const metaItems = [
		{ label: "Empresa", value: brand.companyName },
		{
			label: "Fecha",
			value: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(generatedAt),
		},
	];

	if (brand.companyTagline) {
		metaItems.splice(1, 0, { label: "Lema", value: brand.companyTagline });
	}

	return {
		margin: [32, 22, 32, 0],
		table: {
			widths: ["*", 120],
			body: [
				[
					{
						fillColor: theme.accent,
						color: theme.textOnAccent,
						margin: [18, 16, 18, 14],
						stack: [
							{ text: title, style: "reportTitle" },
							subtitle ? { text: subtitle, style: "reportSubtitle" } : null,
							{
								margin: [0, 12, 0, 0],
								columns: metaItems.map((item) => ({
									width: "auto",
									margin: [0, 0, 16, 0],
									stack: [
										{
											text: item.label.toUpperCase(),
											style: "headerMetaLabel",
										},
										{ text: item.value ?? "—", style: "headerMetaValue" },
									],
								})),
							},
						],
						border: [false, false, false, false],
					},
					{
						fillColor: theme.surface,
						margin: [14, 14, 14, 14],
						stack: [
							logoNode
								? {
										margin: [0, 0, 0, 8],
										alignment: "center",
										...logoNode,
									}
								: {
										fillColor: theme.accentSoft,
										margin: [0, 2, 0, 8],
										padding: [0, 0, 0, 0],
										alignment: "center",
										stack: [
											{ text: brand.logoLabel, style: "logoPlaceholder" },
											{
												text: "Espacio para logo",
												style: "logoPlaceholderHint",
											},
										],
									},
							{ text: brand.companyName, style: "brandName", alignment: "center" },
							brand.companyTagline
								? {
										text: brand.companyTagline,
										style: "brandTagline",
										alignment: "center",
									}
								: null,
						],
						border: [false, false, false, false],
					},
				],
			],
		},
		layout: {
			fillColor: (rowIndex) => (rowIndex === 0 ? theme.accent : null),
			hLineWidth: () => 0,
			vLineWidth: () => 0,
			paddingLeft: () => 0,
			paddingRight: () => 0,
			paddingTop: () => 0,
			paddingBottom: () => 0,
		},
	};
};

const buildFooter = ({ theme, brand, currentPage, pageCount }) => ({
	margin: [32, 0, 32, 24],
	table: {
		widths: ["*", "auto"],
		body: [
			[
				{
					border: [false, true, false, false],
					color: theme.muted,
					text: brand.footerNote,
					style: "footerNote",
					margin: [0, 10, 0, 0],
				},
				{
					border: [false, true, false, false],
					alignment: "right",
					text: `Página ${currentPage} de ${pageCount}`,
					style: "footerPagination",
					margin: [0, 10, 0, 0],
				},
			],
		],
	},
	layout: {
		hLineWidth: (rowIndex) => (rowIndex === 0 ? 1 : 0),
		vLineWidth: () => 0,
		hLineColor: () => theme.border,
		paddingLeft: () => 0,
		paddingRight: () => 0,
		paddingTop: () => 0,
		paddingBottom: () => 0,
	},
});

const buildSummaryCards = ({ summaryCards = [], theme, locale, generatedAt }) => {
	if (!Array.isArray(summaryCards) || summaryCards.length === 0) {
		return null;
	}

	return {
		margin: [0, 0, 0, 14],
		columns: summaryCards.map((card) => ({
			width: "*",
			margin: [0, 0, 10, 0],
			table: {
				widths: ["*"],
				body: [
					[
						{
							fillColor: card.fillColor ?? theme.surface,
							border: [true, true, true, true],
							borderColor: theme.border,
							margin: [14, 12, 14, 12],
							stack: [
								{ text: card.label, style: "summaryLabel" },
								{ text: card.value ?? "—", style: "summaryValue" },
								card.note
									? { text: card.note, style: "summaryNote" }
									: {
											text: `Actualizado ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(generatedAt)}`,
											style: "summaryNote",
										},
							],
						},
					],
				],
			},
			layout: {
				hLineWidth: () => 0,
				vLineWidth: () => 0,
				paddingLeft: () => 0,
				paddingRight: () => 0,
				paddingTop: () => 0,
				paddingBottom: () => 0,
			},
		})),
	};
};

const buildTableBody = ({ columns, rows, theme, locale, data }) => {
	const normalizedColumns = resolveColumns({ columns, rows });
	if (normalizedColumns.length === 0) {
		return {
			widths: ["*"],
			body: [[{ text: "No hay datos para mostrar", style: "tableEmpty" }]],
		};
	}

	const widths = normalizedColumns.map((column) => column.width ?? "*");
	const headerRow = normalizedColumns.map((column) => ({
		text: column.label ?? column.title ?? titleCase(column.field ?? column.key ?? "Columna"),
		style: "tableHeaderCell",
		alignment: column.alignment ?? "left",
		fillColor: theme.accent,
		color: theme.textOnAccent,
		border: [false, false, false, false],
	}));

	const bodyRows = Array.isArray(rows)
		? rows.map((row, rowIndex) =>
				normalizedColumns.map((column, columnIndex) => ({
					text: resolveCellValue({
						row,
						column: { ...column, index: columnIndex },
						rowIndex,
						data,
						locale,
					}),
					style: "tableCell",
					alignment:
						column.alignment ??
						(typeof row?.[column.field ?? column.key ?? column.label] === "number"
							? "right"
							: "left"),
					fillColor: rowIndex % 2 === 0 ? theme.surface : theme.stripe,
					border: [false, false, false, false],
				})),
			)
		: [];

	return {
		widths,
		body: [headerRow, ...bodyRows],
	};
};

const buildDocumentDefinition = ({ data, brand, theme, locale, generatedAt }) => {
	const reportTitle = data.title ?? brand.reportTitle ?? defaultBrand.reportTitle;
	const reportSubtitle = data.subtitle ?? data.description ?? brand.companyTagline ?? null;
	const logoNode = resolveLogo(data.logo ?? brand.logo);
	const columns = resolveColumns({ columns: data.columns, rows: data.rows });
	const tableBody = buildTableBody({ columns, rows: data.rows ?? [], theme, locale, data });
	const summarySection = buildSummaryCards({
		summaryCards: data.summaryCards,
		theme,
		locale,
		generatedAt,
	});

	return {
		pageSize: data.pageSize ?? "A4",
		pageOrientation: data.pageOrientation ?? "portrait",
		pageMargins: data.pageMargins ?? [32, 118, 32, 60],
		header: () =>
			buildHeader({
				brand,
				title: reportTitle,
				subtitle: reportSubtitle,
				theme,
				logoNode,
				locale,
				generatedAt,
			}),
		footer: (currentPage, pageCount) => buildFooter({ theme, brand, currentPage, pageCount }),
		defaultStyle: {
			font: "Roboto",
			fontSize: 10,
			color: theme.text,
		},
		styles: {
			reportTitle: {
				fontSize: 18,
				bold: true,
				color: theme.textOnAccent,
				margin: [0, 0, 0, 3],
			},
			reportSubtitle: {
				fontSize: 9.5,
				color: theme.textOnAccent,
				opacity: 0.9,
			},
			headerMetaLabel: {
				fontSize: 7,
				bold: true,
				color: theme.textOnAccent,
				opacity: 0.8,
				margin: [0, 0, 0, 2],
			},
			headerMetaValue: {
				fontSize: 8.5,
				color: theme.textOnAccent,
			},
			brandName: {
				fontSize: 12,
				bold: true,
				color: theme.text,
				margin: [0, 4, 0, 1],
			},
			brandTagline: {
				fontSize: 8.5,
				color: theme.muted,
			},
			logoPlaceholder: {
				fontSize: 14,
				bold: true,
				color: theme.accent,
				margin: [0, 12, 0, 2],
			},
			logoPlaceholderHint: {
				fontSize: 8,
				color: theme.muted,
				margin: [0, 0, 0, 4],
			},
			summaryLabel: {
				fontSize: 8,
				bold: true,
				color: theme.muted,
			},
			summaryValue: {
				fontSize: 16,
				bold: true,
				color: theme.text,
				margin: [0, 2, 0, 2],
			},
			summaryNote: {
				fontSize: 7.5,
				color: theme.muted,
			},
			tableHeaderCell: {
				fontSize: 9,
				bold: true,
				color: theme.textOnAccent,
				margin: [0, 3, 0, 3],
			},
			tableCell: {
				fontSize: 9,
				margin: [0, 3, 0, 3],
			},
			tableEmpty: {
				fontSize: 9,
				italic: true,
				color: theme.muted,
				alignment: "center",
				margin: [0, 10, 0, 10],
			},
			footerNote: {
				fontSize: 8,
				color: theme.muted,
			},
			footerPagination: {
				fontSize: 8,
				bold: true,
				color: theme.text,
			},
		},
		content: [
			...(summarySection ? [summarySection] : []),
			{
				margin: [0, 0, 0, 8],
				text: data.sectionTitle ?? "Detalle de registros",
				style: {
					fontSize: 12,
					bold: true,
					color: theme.text,
					margin: [0, 0, 0, 8],
				},
			},
			{
				table: {
					widths: tableBody.widths,
					body: tableBody.body,
				},
				layout: {
					fillColor: (rowIndex) => (rowIndex === 0 ? theme.accent : null),
					hLineColor: () => theme.border,
					vLineColor: () => theme.border,
					hLineWidth: (rowIndex) => (rowIndex === 0 ? 0 : 1),
					vLineWidth: () => 0,
					paddingLeft: () => 10,
					paddingRight: () => 10,
					paddingTop: () => 6,
					paddingBottom: () => 6,
				},
			},
		],
	};
};

export const createPdfTemplate = (template = {}) => {
	const brand = {
		...defaultBrand,
		...(template.brand ?? {}),
	};
	const theme = {
		...defaultTheme,
		...(template.theme ?? {}),
	};
	const locale = template.locale ?? defaultLocale;
	const generatedAt = template.generatedAt instanceof Date ? template.generatedAt : new Date();
	const pdfEngine = getEngine();

	pdfEngine.setFonts(fontDescriptors);
	pdfEngine.setLocalAccessPolicy(
		createAccessPolicy({
			allowedLocalPaths: template.allowedLocalPaths ?? [],
			logoPath: brand.logo,
		}),
	);
	pdfEngine.setUrlAccessPolicy(template.urlAccessPolicy ?? (() => false));

	const buildDocument = (data = {}) =>
		buildDocumentDefinition({
			data,
			brand: {
				...brand,
				...(data.brand ?? {}),
			},
			theme,
			locale: data.locale ?? locale,
			generatedAt: data.generatedAt instanceof Date ? data.generatedAt : generatedAt,
		});

	const render = async ({ data = {}, output = "buffer" } = {}) => {
		const docDefinition = buildDocument(data);
		const outputDocument = pdfEngine.createPdf(docDefinition, {
			tableLayouts: {
				reportTable: {
					fillColor: (rowIndex) => (rowIndex === 0 ? theme.accent : null),
					hLineColor: () => theme.border,
					vLineColor: () => theme.border,
				},
			},
		});

		if (output === "definition") {
			return docDefinition;
		}

		if (output === "document") {
			return outputDocument;
		}

		if (output === "stream") {
			return outputDocument.getStream();
		}

		if (output === "dataUrl") {
			return outputDocument.getDataUrl();
		}

		return outputDocument.getBuffer();
	};

	return {
		brand,
		theme,
		locale,
		generatedAt,
		buildDocument,
		render,
		headder: ({ data = {} } = {}) => buildDocument(data).header,
		footer: ({ data = {} } = {}) => buildDocument(data).footer,
	};
};

export const generatePdf = async ({ data = {}, template = {}, output = "buffer" } = {}) => {
	const pdfTemplate = createPdfTemplate(template);
	return pdfTemplate.render({ data, output });
};

export default generatePdf;
