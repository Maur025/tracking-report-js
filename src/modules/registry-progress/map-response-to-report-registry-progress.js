/**
 * @param {Record<string, any>[]} data
 */
export const mapResponseToReportRegistryProgress = (data = []) =>
	data.map((item) => ({
		type: item?.type,
		vehicle: item.vehicle?.map((v) => v.name).join(", "),
		progressFrequencyType: item?.progress?.frequency_type,
		progressName: item?.progress?.name,
		progressValue: isNaN(item.value) ? 0 : Number(item?.value),
		dateFrom: item?.date_from,
		dateTo: item?.date_to,
	}));
