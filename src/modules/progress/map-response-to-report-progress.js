/**
 * @param {Record<string, any>} item
 */
export const mapResponseToReportProgress = (data = []) =>
	data.map((item) => ({
		type: item?.type ? (item.type === "null" ? null : item.type) : null,
		name: item?.name,
		frequencyType: item?.frequency_type,
		frequencies: getFrequencyValues(item?.frequency),
		groups: item?.groups,
		vehicles: item?.vehicles,
		route: getRoute(item?.route),
		geofences: item?.geofences,
		records: item?.registry,
	}));

const getFrequencyValues = (frequencies) => {
	if (!frequencies || !Array.isArray(frequencies) || frequencies.length <= 0) {
		return [];
	}

	return frequencies.map((frequency) => ({
		startTime: frequency?.start_time ?? "N/A",
		endTime: frequency?.end_time ?? "N/A",
		frequencyValue: frequency?.frequency ? Number(frequency.frequency) : "N/A",
	}));
};

const getRoute = (route = {}) => {
	if (!route || !route.name) {
		return {};
	}

	return {
		name: route.name,
	};
};
