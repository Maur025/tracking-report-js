import { logger } from "../../core/common/logger.js";
import { registryProgressReportGetData } from "./registry-progress-get-data.js";

/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {{name:string, host:string}} request.database
 * @param {{sortBy:string, descending:boolean}} request.pagination
 * @param {Record<string, unknown>} request.filters
 */
export async function* registryProgressReportStream({ axios, database, pagination, filters }) {
	let page = 0;
	const size = 100;
	let hasMoreData = true;

	while (hasMoreData) {
		try {
			const registryProgressList = await registryProgressReportGetData({
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

			if (registryProgressList.data?.length <= 0) {
				hasMoreData = false;
				break;
			}

			for (const registryProgress of registryProgressList.data) {
				yield registryProgress;
			}

			if (registryProgressList.data?.length < size) {
				hasMoreData = false;
				break;
			}

			page++;
		} catch (error) {
			logger.error("Error fetching registry progress report data:", error);
			throw error;
		}
	}
}
