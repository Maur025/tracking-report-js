import { logger } from "../../core/common/logger.js";
import { rulesReportGetData } from "./rules-get-data.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {{name:string, host:string}} request.database
 * @param {{sortBy:string, descending:boolean}} request.pagination
 * @param {Record<string, unknown>} request.filters
 */
export async function* rulesReportStream({ axios, database, pagination, filters }) {
	let page = 0;
	const size = 100;
	let hasMoreData = true;

	while (hasMoreData) {
		try {
			const ruleList = await rulesReportGetData({
				axios,
				dbName: database.name,
				dbHost: database.host,
				pagination: {
					page,
					size,
					sortBy: pagination.sortBy,
					descending: pagination.descending,
				},
				filters,
			});

			if (ruleList.data?.length <= 0) {
				hasMoreData = false;
				break;
			}

			for (const rule of ruleList.data) {
				yield rule;
			}

			if (ruleList.data?.length < size) {
				hasMoreData = false;
				break;
			}

			page++;
		} catch (error) {
			logger.error("Error fetching rules report data:", error);
			throw error;
		}
	}
}
