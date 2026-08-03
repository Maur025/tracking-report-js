import { logger } from "../../core/common/logger.js";
import { eventReportGetData } from "./event-report-get-data.js";

export async function* eventReportStream({ axios, database, pagination, filters }) {
	let page = 0;
	const size = 100;
	let hasMoreData = true;

	while (hasMoreData) {
		try {
			const eventList = await eventReportGetData({
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

			if (eventList.data?.length <= 0) {
				hasMoreData = false;
				break;
			}

			for (const event of eventList.data) {
				yield event;
			}

			if (eventList.data?.length < size) {
				hasMoreData = false;
				break;
			}

			page++;
		} catch (error) {
			logger.error("Error fetching event report data:", error);
			throw error;
		}
	}
}
