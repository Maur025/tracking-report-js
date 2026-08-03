/**
 * @param {Record<string, any>} item
 */
export const normalizeRegistryProgressItem = (item) => ({
	...item,
	type: item?.type,
	vehicle: Array.isArray(item?.vehicle)
		? item.vehicle.map((vehicle) => vehicle?.name).filter(Boolean)
		: item?.vehicle,
	progress: item?.progress
		? {
				name: item.progress.name,
				frequency_type: item.progress.frequency_type,
			}
		: item?.progress,
	routes: Array.isArray(item?.routes)
		? item.routes.map((route) => ({
				completed: route?.completed,
			}))
		: item?.routes,
	date_from: item?.date_from,
	date_to: item?.date_to,
});
