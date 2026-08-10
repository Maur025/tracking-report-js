import { getHoursOfTimestamp } from "../../../core/common/date/get-hours-of-timestamp.js";
import { getWeekday } from "../../../core/common/date/get-weekday.js";

export const getProgressType = (value = null) => {
	switch (value) {
		case "GEOFENCES":
			return "Geocerca";
		case "ROUTE":
			return "Ruta";
		case "IPOINT":
			return "Punto de interés";
		default:
			return "N/A";
	}
};

export const getFrequencyType = (value = null) => {
	switch (value) {
		case "DIARY":
			return "Diario";
		case "WEEKLY":
			return "Semanal";
		case "MONTHLY":
			return "Mensual";
		default:
			return "N/A";
	}
};

export const getProgressName = (nameValue, typeValue, frequencyTypeValue) => {
	const progressType = getProgressType(typeValue);
	const frequencyType = getFrequencyType(frequencyTypeValue);

	return nameValue
		? `${nameValue} (${progressType}, ${frequencyType})`
		: `N/A (${progressType}, ${frequencyType})`;
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

export const getProgressScope = (groups = [], vehicles = []) => {
	return `Grupos: ${getCount(groups)}\nVehículos: ${getCount(vehicles)}`;
};

const getRouteName = (route) => {
	console.log(route);

	return route.name ?? "N/A";
};

export const getProgressOperationalContext = (route = {}, geofences = [], interestPoints = []) => {
	const routeName = getRouteName(route);

	if (routeName === "N/A") {
		return `Geocercas: ${getCount(geofences)}\nPuntos de interés: ${getCount(interestPoints)}`;
	}

	return `Ruta: ${routeName}`;
};

export const getProgressRecords = (records = []) => {
	return getCount(records);
};
