import { getHoursOfTimestamp } from "../../../core/common/date/get-hours-of-timestamp.js";
import { getWeekday } from "../../../core/common/date/get-weekday.js";

export const getRuleType = (value) => {
	console.log(value);

	switch (value) {
		case "GEOFENCES":
			return "Geocerca";
		case "SENSORS":
			return "Sensor";
		default:
			return "N/A";
	}
};

export const getRuleName = (nameValue, typeValue) => {
	const type = getRuleType(typeValue);

	return nameValue ? `${nameValue} (${type})` : `N/A (${type})`;
};

export const getFrequencies = (values = [], zoneId = "UTC") => {
	if (!Array.isArray(values) || values.length === 0) {
		return "N/A";
	}

	return values
		.map(
			(frequency) =>
				`${getWeekday(frequency.frequencyValue)} (${getHoursOfTimestamp({ timestamp: frequency.startTime, zoneId })} - ${getHoursOfTimestamp({ timestamp: frequency.endTime, zoneId })})`,
		)
		.join("\n");
};

const getCount = (value = []) => {
	if (!Array.isArray(value) || value.length === 0) {
		return "0";
	}

	return `${value.length}`;
};

export const getRuleEvents = (alerts = [], notifications = []) => {
	return `Alertas: ${getCount(alerts)}\nNotificaciones: ${getCount(notifications)}`;
};

export const getRuleScope = (groups = [], vehicles = []) => {
	return `Grupos: ${getCount(groups)}\nVehículos: ${getCount(vehicles)}`;
};

export const getRuleOperationalContext = (geofences = [], interestPoints = [], sensors = []) => {
	return `Geocercas: ${getCount(geofences)}\nPuntos de interés: ${getCount(interestPoints)}\nSensores: ${getCount(sensors)}`;
};
