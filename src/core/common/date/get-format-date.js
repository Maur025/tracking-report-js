/**
 * @param {object} request
 * @param {Date} request.date
 * @param {string} [request.locales]
 * @param {string} [request.year]
 * @param {string} [request.month]
 * @param {string} [request.day]
 * @param {string} [request.hour]
 * @param {string} [request.minute]
 * @returns {string}
 */
export const getFormatDate = ({
	date,
	locales = "es-BO",
	year = "numeric",
	month = "2-digit",
	day = "2-digit",
	hour = "2-digit",
	minute = "2-digit",
}) => {
	return date.toLocaleString(locales, {
		hour12: false,
		year,
		month,
		day,
		hour,
		minute,
	});
};
