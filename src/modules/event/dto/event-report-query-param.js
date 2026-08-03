import { array, string, union } from "zod";
import { dateFilterRequestSchema } from "../../../core/common/dto/date-filter-request-schema.js";

export const eventReportQueryParam = dateFilterRequestSchema.extend({
	databaseName: string().nonempty(),
	sortBy: string().optional().default("date"),
	descending: string()
		.optional()
		.default("true")
		.transform((value) => value === "true"),
	page: string()
		.optional()
		.default("0")
		.transform((value) => parseInt(value, 10)),
	size: string()
		.optional()
		.default("20")
		.transform((value) => parseInt(value, 10)),
	disposition: string().optional().default("inline"),
	fileName: string().optional().default("example"),

	vehicleId: string().nonempty().optional(),
	ruleId: string().nonempty().optional(),
	inout: string().nonempty().optional(),
	geofenceId: string().nonempty().optional(),
	type: union([string().nonempty(), array(string().nonempty()).nonempty()]).optional(),
	deventId: string().nonempty().optional(),

	filterByLabel: string().nonempty().optional(),
	format: string().nonempty().optional(),
});
