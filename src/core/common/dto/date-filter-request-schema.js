import { Temporal } from "@js-temporal/polyfill";
import { object, string } from "zod";

const isoToZonedDateTime = string()
	.nonempty()
	.min(1, "Date string cannot be empty")
	.transform((val) => Temporal.Instant.from(val).toZonedDateTimeISO("UTC"))
	.optional();

export const dateFilterRequestSchema = object({
	date: isoToZonedDateTime,
	fromDate: isoToZonedDateTime,
	toDate: isoToZonedDateTime,
	monthDate: isoToZonedDateTime,
	yearDate: isoToZonedDateTime,
	zoneId: string().nonempty().optional(),
});
