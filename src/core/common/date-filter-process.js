import { Temporal } from "@js-temporal/polyfill";

/**
 * @param {{
 * date: Temporal.Instant;
 * zoneId?: string;
 * fromDate?: Temporal.Instant;
 * toDate?: Temporal.Instant;
 * monthDate?: Temporal.Instant;
 * yearDate?: Temporal.Instant;
 * }} request
 */
export const dateFilterProcess = ({
	date,
	fromDate,
	toDate,
	monthDate,
	yearDate,
	zoneId = "UTC",
}) => {
	if (fromDate && toDate) {
		if (fromDate.epochMilliseconds > toDate.epochMilliseconds) {
			throw new Error("fromDate cannot be greater than toDate");
		}

		const fromDateInClientZone = Temporal.Instant.from(fromDate).toZonedDateTimeISO(zoneId);
		const toDateInClientZone = Temporal.Instant.from(toDate).toZonedDateTimeISO(zoneId);

		const startDay = fromDateInClientZone.toPlainDate().toZonedDateTime(zoneId);
		const endDay = toDateInClientZone
			.toPlainDate()
			.toZonedDateTime(zoneId)
			.add({ days: 1 })
			.subtract({ nanoseconds: 1 });

		return {
			fromDate: startDay.toInstant().epochMilliseconds,
			toDate: endDay.toInstant().epochMilliseconds,
		};
	}

	if (yearDate) {
		const yearDateInClientZone = Temporal.Instant.from(yearDate).toZonedDateTimeISO(zoneId);
		const startYear = yearDateInClientZone
			.toPlainDate()
			.with({ month: 1, day: 1 })
			.toZonedDateTime(zoneId);
		const endYear = startYear.add({ years: 1 }).subtract({ nanoseconds: 1 });

		return {
			fromDate: startYear.toInstant().epochMilliseconds,
			toDate: endYear.toInstant().epochMilliseconds,
		};
	}

	if (monthDate) {
		const monthDateInClientZone = Temporal.Instant.from(monthDate).toZonedDateTimeISO(zoneId);
		const startMonth = monthDateInClientZone
			.toPlainDate()
			.with({ day: 1 })
			.toZonedDateTime(zoneId);
		const endMonth = startMonth.add({ months: 1 }).subtract({ nanoseconds: 1 });

		return {
			fromDate: startMonth.toInstant().epochMilliseconds,
			toDate: endMonth.toInstant().epochMilliseconds,
		};
	}

	if (!date) {
		return {};
	}

	const dateInClientZone = Temporal.Instant.from(date).toZonedDateTimeISO(zoneId);

	const startDay = dateInClientZone.toPlainDate().toZonedDateTime(zoneId);
	const endDay = startDay.add({ days: 1 }).subtract({ nanoseconds: 1 });

	return {
		fromDate: startDay.toInstant().epochMilliseconds,
		toDate: endDay.toInstant().epochMilliseconds,
	};
};
