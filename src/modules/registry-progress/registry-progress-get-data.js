/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {string} [request.dbName]
 * @param {string} [request.dbHost]
 * @param {{page:number,size:number,sortBy:string,descending:boolean}} [request.pagination]
 * @param {Record<string, unknown>} [request.filters]
 */
export const registryProgressReportGetData = async ({
	axios,
	dbName = "trackingdb",
	dbHost = "http://localhost:9999",
	pagination = {
		page: 0,
		size: 20,
		sortBy: "date_from",
		descending: true,
	},
	filters = {},
}) => {
	const transformedFilters = transformFilters(filters);

	const response = await axios.get(`${dbHost}/${dbName}/registry_progress`, {
		params: {
			...transformedFilters,
			page: pagination.page,
			size: pagination.size,
			sortBy: pagination.sortBy,
			descending: pagination.descending,
		},
		paramsSerializer: {
			indexes: null,
		},
	});

	if (response.status >= 400 && response.status <= 599) {
		throw new Error(
			`Error fetching registry progress report data: ${response.status} ${response.statusText}`,
		);
	}

	return {
		data: response.data?.content ?? response.data?.data ?? [],
		pagination: response.data?.pagination ?? null,
	};
};

/**
 * @param {Record<string, unknown>} filters
 */
const transformFilters = (filters) => {
	const transformedFilters = {};

	for (const [key, value] of Object.entries(filters)) {
		if (!value) {
			continue;
		}

		switch (key) {
			case "type":
				transformedFilters.type = value;
				break;
			case "vehicle":
				transformedFilters.vehicle = value;
				break;
			case "progress":
				transformedFilters.progress = value;
				break;
			case "routes":
				transformedFilters.routes = value;
				break;
			case "fromDate":
				transformedFilters["[date_from][between][from]"] = value;
				break;
			case "toDate":
				transformedFilters["[date_to][between][to]"] = value;
				break;
			default:
				transformedFilters[key] = value;
				break;
		}
	}

	return transformedFilters;
};
