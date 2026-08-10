import { logger } from "../../core/common/logger.js";
import { progressReportGetData } from "./progress-get-data.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {{name:string, host:string}} request.database
 * @param {{sortBy:string, descending:boolean}} request.pagination
 * @param {Record<string, unknown>} request.filters
 */
export async function* progressReportStream({ axios, database, pagination, filters }) {
	let page = 0;
	const size = 100;
	let hasMoreData = true;

	while (hasMoreData) {
		try {
			const progressList = await progressReportGetData({
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

			if (progressList.data?.length <= 0) {
				hasMoreData = false;
				break;
			}

			for (const progress of progressList.data) {
				yield progress;
			}

			if (progressList.data?.length < size) {
				hasMoreData = false;
				break;
			}

			page++;
		} catch (error) {
			logger.error("Error fetching progress report data:", error);
			throw error;
		}
	}
}
