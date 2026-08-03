import { array, string, union } from "zod";
import { dateFilterRequestSchema } from "../../../core/common/dto/date-filter-request-schema.js";

export const registryProgressQueryParam = dateFilterRequestSchema.extend({
	databaseName: string().nonempty(),
	sortBy: string().optional().default("date_from"),
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

	type: union([string().nonempty(), array(string().nonempty()).nonempty()]).optional(),
	vehicleId: union([string().nonempty(), array(string().nonempty()).nonempty()]).optional(),
	progressId: union([string().nonempty(), array(string().nonempty()).nonempty()]).optional(),

	filterByLabel: string().nonempty().optional(),
	format: string().nonempty().optional(),
});
