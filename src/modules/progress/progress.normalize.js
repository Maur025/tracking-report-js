/**
 * @param {Record<string, any>} item
 */
export const normalizeProgressItem = (item) => ({
	...item,
	type: item?.type,
	name: item?.name,
	frequency_type: item?.frequency_type,
	frequency: Array.isArray(item?.frequency)
		? item.frequency
				.map((frequency) => {
					const startTime = frequency?.start_time ?? "N/A";
					const endTime = frequency?.end_time ?? "N/A";
					const frequencyValue = frequency?.frequency ?? "N/A";

					return `${startTime} - ${endTime} - ${frequencyValue}`;
				})
				.join(", ")
		: item?.frequency,
	groups: Array.isArray(item?.groups)
		? item.groups.map((group) => group?.name).filter(Boolean).join(", ")
		: item?.groups?.name ?? item?.groups,
	vehicles: Array.isArray(item?.vehicles)
		? item.vehicles.map((vehicle) => vehicle?.name).filter(Boolean).join(", ")
		: item?.vehicles?.name ?? item?.vehicles,
});
