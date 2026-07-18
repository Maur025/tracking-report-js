import { getObjectOfString } from "../../core/common/get-object-of-string.js";

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
	filters,
}) => {
	const response = await axios.get(
		`${dbHost}/${dbName}/registry_events/eventnotification?size=${pagination.size}&page=${pagination.page}&sortBy=${pagination.sortBy}&descending=${pagination.descending}`,
	);

	if (response.status >= 400 && response.status <= 599) {
		throw new Error(
			`Error fetching event report data: ${response.status} ${response.statusText}`,
		);
	}

	return mapResponseToReportData(response.data?.content);
};

const mapResponseToReportData = (data) =>
	data?.map((item) => ({
		vehicles: item.vehicle.map((v) => `${v.name} (${v.type})`).join(", "),
		vehicleOtherData: getObjectOfString(item.vehicle?.metadata),
		geofence: item.geofence?.name,
		rule: item.rule?.name,
		ruleDescription: item.rule?.description,
		deviceImei: item.device?.imei,
		deviceType: item.device?.gpsspec_id,
		devicePosition: [item.lon, item.lat],
		date: item.date,
		eventName: item.type_name,
		inout: item.inout,
		conditionOperator: item.condition_operator,
		conditionValue: item.condition_value,
		devent: item.devent?.name,
		value: item.value,
	}));
