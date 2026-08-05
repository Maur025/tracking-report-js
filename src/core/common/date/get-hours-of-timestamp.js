import { Temporal } from "@js-temporal/polyfill";

export const getHoursOfTimestamp = ({
	timestamp,
	zoneId = "UTC",
	hour = "2-digit",
	minute = "2-digit",
	hour12 = false,
}) => {
	const dateTemporal =
		Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(zoneId);

	return dateTemporal.toLocaleString("en-US", {
		hour,
		minute,
		hour12,
	});
};
