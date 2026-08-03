/**
 * @param {object} request
 * @param {import('axios').AxiosInstance} request.axios
 * @param {string} [request.dbName]
 * @param {string} [request.dbHost]
 * @param {{page:number,size:number,sortBy:string,descending:boolean}} [request.pagination]
 * @param {Record<string, unknown>} [request.filters]
 */
export const rulesReportGetData = async ({
	axios,
	dbName = "trackingdb",
	dbHost = "http://localhost:9999",
	pagination = {
		page: 0,
		size: 20,
		sortBy: "name",
		descending: true,
	},
	filters = {},
}) => {
	const response = await axios.get(`${dbHost}/${dbName}/rules`, {
		params: {
			...filters,
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
			`Error fetching rules report data: ${response.status} ${response.statusText}`,
		);
	}

	return {
		data: response.data?.content ?? response.data?.data ?? [],
		pagination: response.data?.pagination ?? null,
	};
};
