import { string } from "zod";
import { dateFilterRequestSchema } from "../../../core/common/dto/date-filter-request-schema.js";

export const rulesQueryParam = dateFilterRequestSchema.extend({
	databaseName: string().nonempty(),
	sortBy: string().optional().default("name"),
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
	filterByLabel: string().nonempty().optional(),
	format: string().nonempty().optional(),
	keyword: string().nonempty().optional(),
});
