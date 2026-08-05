import { HttpStatusCode } from "axios";
import { rulesQueryParam } from "./dto/rules-query-param.js";
import { rulesExcelReport } from "./rules-excel-report.js";
import { rulesPdfReport } from "./rules-pdf-report.js";
import { rulesReportGetData } from "./rules-get-data.js";
import { serverResponse } from "../../core/server-response.js";

export class RulesController {
	#resource = "reports/rules";

	#axios;
	#getDatabaseConfig;

	/**
	 * @param {{
	 * axios: import("axios");
	 * getDatabaseConfig: ReturnType<typeof import("../../core/common/action/get-database-config.js").getDatabaseConfig>;
	 * }} request
	 */
	constructor({ axios, getDatabaseConfig }) {
		this.#axios = axios;
		this.#getDatabaseConfig = getDatabaseConfig;
	}

	/**
	 * @param {import('express').Application} app
	 * @param {string} basePath
	 */
	registerRoutes(app, basePath) {
		const path = `${basePath}/${this.#resource}`;

		app.get(path, (req, res) => this.#handleRulesGet(req, res));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	async #handleRulesGet(req, res) {
		const validQueryParams = rulesQueryParam.parse(req.query);

		if (
			validQueryParams.format &&
			!["json", "excel", "pdf"].includes(validQueryParams.format)
		) {
			return res
				.status(HttpStatusCode.BadRequest)
				.json({ error: "Invalid format parameter" });
		}

		const { getConfig } = this.#getDatabaseConfig;

		const dbConfig = await getConfig({
			databaseName: validQueryParams.databaseName,
		});

		const reportFilters = {
			keyword: validQueryParams.keyword,
		};

		if (!validQueryParams.format || validQueryParams.format === "json") {
			return this.#handleRulesReportJson({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
		}

		if (validQueryParams.format === "excel") {
			await this.#handleRulesReportExcel({
				validQueryParams,
				res,
				dbConfig,
				reportFilters,
			});
			return;
		}

		await this.#handleRulesReportPdf({
			validQueryParams,
			res,
			dbConfig,
			reportFilters,
		});
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof rulesQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleRulesReportJson({ validQueryParams, res, dbConfig, reportFilters }) {
		const rulesData = await rulesReportGetData({
			axios: this.#axios,
			dbName: dbConfig.name,
			dbHost: dbConfig.host,
			pagination: {
				page: validQueryParams.page,
				size: validQueryParams.size,
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			filters: reportFilters,
		});

		return res.status(HttpStatusCode.Ok).json(
			serverResponse({
				data: rulesData.data,
				code: HttpStatusCode.Ok,
				pagination: rulesData.pagination,
			}),
		);
	}

	/**
	 * @param {{
	 *  validQueryParams: ReturnType<typeof rulesQueryParam.parse>;
	 *  res: import('express').Response;
	 *  dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object
	 * }} request
	 */
	async #handleRulesReportPdf({ validQueryParams, res, dbConfig, reportFilters }) {
		await rulesPdfReport({
			axios: this.#axios,
			res,
			enterpriseData: dbConfig.enterprise,
			reportParams: {
				disposition: validQueryParams.disposition,
				fileName: validQueryParams.fileName,
				zoneId: validQueryParams.zoneId,
			},
			databaseConfig: dbConfig,
			paginationParams: {
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			reportFilters,
			filterByLabel: validQueryParams.filterByLabel,
		});
	}

	/**
	 * @param {{
	 * 	validQueryParams: ReturnType<typeof rulesQueryParam.parse>;
	 * 	res: import('express').Response;
	 * 	dbConfig: ReturnType<typeof import('../../core/common/action/get-database-config.js').getDatabaseConfig>;
	 *  reportFilters: object;
	 * }} request
	 */
	async #handleRulesReportExcel({ validQueryParams, res, dbConfig, reportFilters }) {
		await rulesExcelReport({
			axios: this.#axios,
			res,
			reportParams: {
				disposition: validQueryParams.disposition,
				fileName: validQueryParams.fileName,
				zoneId: validQueryParams.zoneId,
			},
			databaseConfig: { name: validQueryParams.databaseName, host: dbConfig.host },
			paginationParams: {
				sortBy: validQueryParams.sortBy,
				descending: validQueryParams.descending,
			},
			reportFilters,
			enterpriseData: dbConfig.enterprise,
			filterByLabel: validQueryParams.filterByLabel,
		});
	}
}
