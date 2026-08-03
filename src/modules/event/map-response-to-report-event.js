import { getObjectOfString } from "../../core/common/get-object-of-string.js";

export const mapResponseToReportEvent = (data = []) =>
	data?.map((item) => ({
		vehicles: item.vehicle.map((v) => v.name).join(", "),
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
