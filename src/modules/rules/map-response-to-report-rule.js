/**
 * @param {Record<string, any>} item
 */
export const mapResponseToReportRule = (data = []) =>
	data.map((item) => ({
		type: item?.type ? (item.type === "null" ? null : item.type) : null,
		name: item?.name,
		alerts: item?.alerts?.map((alert) => alert?.name),
		notifications: item?.notifications,
		vehicles: item.vehicles,
		groups: item.groups,
		frequency: getFrequencyValues(item?.frequency),
		geofences: item.geofences,
		interestPoints: item.ipoints,
		sensors: item.sensors,
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
