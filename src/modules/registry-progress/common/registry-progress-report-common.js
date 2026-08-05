import { getFormatDateOfTimestamp } from "../../../core/common/date/get-format-date.js";

export const getDate = (value, zoneId) => {
	return value ? getFormatDateOfTimestamp({ timestamp: value, zoneId }) : "N/A";
};

export const getVehicleName = (value) => {
	return value ?? "N/A";
};

export const getProgressValue = (value) => {
	return `${value ?? "0"} %`;
};

export const getItemProgressName = (nameValue, frequencyValue) => {
	const frequencyType = getTypeFrequency(frequencyValue);

	return `${nameValue ?? "N/A"} (${frequencyType})`;
};

export const getTypeFrequency = (value) => {
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

export const getTypeProgress = (value) => {
	switch (value) {
		case "ROUTE":
			return "Ruta";
		case "GEOFENCES":
			return "Geocerca";
		case "POINT":
			return "Punto de Interés";
		default: {
			return "N/A";
		}
	}
};
