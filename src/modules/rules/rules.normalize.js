/**
 * @param {Record<string, any>} item
 */
export const normalizeRuleItem = (item) => ({
	...item,
	type: item?.type,
	name: item?.name,
	alerts: Array.isArray(item?.alerts)
		? item.alerts.map((alert) => alert?.name).filter(Boolean).join(", ")
		: item?.alerts?.name ?? item?.alerts,
	frecuency: Array.isArray(item?.frecuency)
		? item.frecuency
				.map((frecuency) => {
					const startTime = frecuency?.start_time ?? "N/A";
					const endTime = frecuency?.end_time ?? "N/A";
					const frecuencyValue = frecuency?.frecuency ?? "N/A";

					return `${startTime} - ${endTime} - ${frecuencyValue}`;
				})
				.join(", ")
		: item?.frecuency,
});
