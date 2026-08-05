import { Temporal } from "@js-temporal/polyfill";

/**
 * @param {{
 * 	timestamp: number;
 * 	locales: string;
 * 	hour12: boolean;
 * 	year: '2-digit'|'numeric';
 * 	month: '2-digit'| 'long'|'narrow'|'numeric'|'short';
 * 	day: '2-digit'|'numeric';
 *  hour: '2-digit'|'numeric';
 * 	minute: '2-digit'|'numeric';
 * 	zoneId: string
 * }} request
 * @returns {string}
 */
export const getFormatDateOfTimestamp = ({
	timestamp,
	locales = "en-US",
	year = "numeric",
	month = "2-digit",
	day = "2-digit",
	hour = "2-digit",
	minute = "2-digit",
	zoneId = "UTC",
}) => {
	const dateTemporal = timestamp
		? getTemporalOfTimestamp(timestamp, zoneId)
		: getNewTemporal(zoneId);

	return dateTemporal.toLocaleString(locales, {
		hour12: false,
		year,
		month,
		day,
		hour,
		minute,
	});
};

const getTemporalOfTimestamp = (timestamp, zoneId = "UTC") =>
	Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(zoneId);

const getNewTemporal = (zoneId = "UTC") => Temporal.Now.zonedDateTimeISO(zoneId);
