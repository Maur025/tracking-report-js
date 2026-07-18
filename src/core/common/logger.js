const loggerNativo = { ...console };

import { overrideLog } from "atx-prettylog";
import chalk from "chalk";

overrideLog();

const getTrace = () => {
	const nodePrepareStackTrace = Error.prepareStackTrace;

	Error.prepareStackTrace = (_, stack) => stack;

	const stack = new Error().stack;

	Error.prepareStackTrace = nodePrepareStackTrace;

	const caller = stack?.find((frame) => {
		const fileName = frame.getFileName();
		return fileName && !fileName.includes("node:internal") && !fileName.includes("console");
	});

	return caller ? `${caller.getFileName()}:${caller.getLineNumber()}` : "unknown location";
};

const getDateTime = () => {
	const now = new Date();

	const formatter = new Intl.DateTimeFormat("sv-SE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		fractionalSecondDigits: 3,
		hour12: false,
	});

	return formatter.format(now).replace("T", " ").replace(",", ".");
};

export const logger = {
	error: (...args) => {
		const date = chalk.red(`${getDateTime()}`);
		const prefix = chalk.bold.red("[ERROR]");

		loggerNativo.log.apply(console, [`${date} ${prefix} (${chalk.gray(getTrace())})`, ...args]);
	},
};
