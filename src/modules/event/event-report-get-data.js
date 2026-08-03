import { mapResponseToReportEvent } from "./map-response-to-report-event.js";

export const eventReportGetData = async ({
	axios,
	dbName = "trackingdb",
	dbHost = "http://localhost:9999",
	pagination = {
		page: 0,
		size: 20,
		sortBy: "date",
		descending: true,
	},
	filters = {},
}) => {
	const transformedFilters = transformFilters(filters);

	const response = await axios.get(`${dbHost}/${dbName}/registry_events/eventnotification`, {
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
			`Error fetching event report data: ${response.status} ${response.statusText}`,
		);
	}

	return {
		data: mapResponseToReportEvent(response.data?.content),
		pagination: response.data?.pagination ?? null,
	};
};

const transformFilters = (filters) => {
	const transformedFilters = {};
	for (const [key, value] of Object.entries(filters)) {
		if (!value) {
			continue;
		}

		switch (key) {
			case "vehicleId":
				transformedFilters["[vehicle_id][equal]"] = value;
				break;
			case "ruleId": {
				transformedFilters["[rule_id][equal]"] = value;
				break;
			}
			case "inout": {
				transformedFilters["[inout][equal]"] = value;
				break;
			}
			case "geofenceId": {
				transformedFilters["[geofence_id][equal]"] = value;
				break;
			}
			case "type": {
				transformedFilters["[type_name][equal]"] = value;
				break;
			}
			case "deventId": {
				transformedFilters["[devent_id][equal]"] = value;
				break;
			}
			case "fromDate": {
				transformedFilters["[date][between][from]"] = value;
				break;
			}
			case "toDate": {
				transformedFilters["[date][between][to]"] = value;
				break;
			}
			default:
				transformedFilters[key] = value;
				break;
		}
	}

	return transformedFilters;
};
