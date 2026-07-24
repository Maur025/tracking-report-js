import { array, object, string, union } from "zod";

export const eventReportQueryParam = object({
	databaseName: string().nonempty(),
	sortBy: string().optional().default("date"),
	descending: string().optional().default("true"),
	disposition: string().optional().default("inline"),
	fileName: string().optional().default("example"),

	vehicleId: string().nonempty().optional(),
	ruleId: string().nonempty().optional(),
	inout: string().nonempty().optional(),
	geofenceId: string().nonempty().optional(),
	type: union([string().nonempty(), array(string().nonempty()).nonempty()]).optional(),
	deventId: string().nonempty().optional(),
});
