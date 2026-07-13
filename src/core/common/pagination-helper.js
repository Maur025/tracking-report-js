/**
 * @returns {{page: number, size: number, offset:number, orderBy?: any, descending?: boolean}}
 */
export const validateAndParse = ({ page, size, orderBy, descending }) => {
	if (page === null || page === undefined || size === null || size === undefined) {
		throw new Error("Page and size parameters are required for pagination");
	}

	const safePage = parserNumber(page);
	const safeSize = parserNumber(size);

	if (descending !== null && descending !== undefined && typeof descending !== "boolean") {
		throw new Error("Descending parameter must be a boolean");
	}

	if (safePage < 0) {
		throw new Error("Page number must be greater than or equal to 0");
	}

	if (safeSize < 1) {
		throw new Error("Size must be greater than or equal to 1");
	}

	const offset = safePage * safeSize;

	return { page: safePage, size: safeSize, offset, orderBy, descending };
};

/**
 * @param {number} total
 * @param {number} size
 * @returns {number}
 */
export const calculateTotalPages = (total, size) => {
	const safeTotal = parserNumber(total);
	const safeSize = parserNumber(size);

	if (safeTotal < 0 || safeSize <= 0) {
		throw new Error("Total must be greater than or equal to 0 and size must be greater than 0");
	}

	return Math.ceil(safeTotal / safeSize);
};

/**
 * @param {number} value
 * @returns {number}
 */
const parserNumber = (value) => {
	if (Number.isNaN(Number(value))) {
		throw new Error(`Value ${value} is not a valid number`);
	}

	return Number(value);
};

export const getOrderByValues = (values, descending = null) => {
	if (values === null || values === undefined) {
		return [];
	}

	if (!Array.isArray(values) && typeof values === "string") {
		return [[values, descending]];
	}

	if (Array.isArray(values)) {
		return values.map((value) => {
			if (!value) {
				return null;
			}

			if (!Array.isArray(value)) {
				return [value];
			}

			return value;
		});
	}

	console.warn(
		"[PaginationHelper] getOrderByValues: Unexpected type for orderBy values. Expected array or string, got:",
		typeof values,
	);

	return [];
};

export const mapOrderBy = (values) => {
	const orderByConfig = {};
	const orderValues = {};

	for (const value of values) {
		const [orderBy, direction] = value;

		if (orderBy === null || orderBy === undefined || orderBy === "") {
			continue;
		}

		orderValues[orderBy] = direction ? "desc" : "asc";
	}

	if (Object.keys(orderValues).length > 0) {
		orderByConfig.orderBy = orderValues;
	}

	return orderByConfig;
};
