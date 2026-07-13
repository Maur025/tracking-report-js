import { eq } from "drizzle-orm";
import {
	calculateTotalPages,
	getOrderByValues,
	mapOrderBy,
	validateAndParse,
} from "../common/pagination-helper.js";
import { count as drizzleCount } from "drizzle-orm";

/**
 *
 * @param {object} request
 * @param {import('drizzle-orm/libsql').LibSQLDatabase} request.dbClient
 * @param {import('drizzle-orm/sqlite-core').SQLiteTable} request.table
 * @param {object} request.withData
 * @param {string} request.tableName
 */
export const dbRepository = ({ dbClient, table, withData = {}, tableName }) => {
	const getConfigWithData = () => {
		const config = {};

		if (withData) {
			config.with = withData;
		}

		return config;
	};

	/**
	 * @param {object} request
	 * @param {object} request.data
	 * @param {object} request.options
	 * @param {import('drizzle-orm/libsql').LibSQLTransaction | undefined} request.transaction
	 */
	const save = async ({ data, options = {}, transaction = undefined }) => {
		// eslint-disable-next-line no-unused-vars
		const { id, ...updateData } = data;
		const target = options?.target || options?.setTarget?.(table) || table.id;
		const dbClientToUse = transaction || dbClient;

		const [result] = await dbClientToUse
			.insert(table)
			.values(data)
			.onConflictDoUpdate({
				target,
				set: updateData,
			})
			.returning();

		return result;
	};

	const findAll = async () => {
		const config = getConfigWithData();

		return dbClient.query[tableName].findMany({
			...config,
		});
	};

	/**
	 * @param {object} request
	 * @param {number} request.page
	 * @param {number} request.size
	 * @param {string|[string, boolean][]} request.orderBy
	 * @param {boolean|undefined} request.descending
	 */
	const findAllWithPagination = async (request) => {
		const { size, offset, orderBy, descending } = validateAndParse(request);

		const config = getConfigWithData();
		const orderConfig = mapOrderBy(getOrderByValues(orderBy, descending));

		const [total, result] = await Promise.all([
			count(),
			dbClient.query[tableName].findMany({
				...config,
				...orderConfig,
				limit: size,
				offset,
			}),
		]);

		return {
			data: result,
			totalPages: calculateTotalPages(total, size),
			totalElements: total,
		};
	};

	/**
	 * @param {object} request
	 * @param {string} request.id
	 */
	const findById = async ({ id }) => {
		const config = getConfigWithData();

		return dbClient.query[tableName].findFirst({
			...config,
			where: {
				id: id,
			},
		});
	};

	/**
	 * @param {object} request
	 * @param {string} request.id
	 */
	const findByIdThrow = async ({ id }) => {
		const existingRecord = await findById({ id });

		if (!existingRecord) {
			throw new Error(`Record with id ${id} not found in ${tableName}`);
		}

		return existingRecord;
	};

	/**
	 * @param {object} request
	 * @param {object} request.data
	 * @param {string} request.id
	 * @param {import('drizzle-orm/libsql').LibSQLTransaction | undefined} request.transaction
	 */
	const updateById = async ({ data, id, transaction = undefined }) => {
		const dbClientToUse = transaction || dbClient;

		await findByIdThrow({ id });
		const [result] = await dbClientToUse
			.update(table)
			.set(data)
			.where(eq(table.id, id))
			.returning();

		return result;
	};

	/**
	 * @param {object} request
	 * @param {string} request.id
	 * @param {import('drizzle-orm/libsql').LibSQLTransaction | undefined} request.transaction
	 */
	const deleteById = async ({ id, transaction = undefined }) => {
		await findByIdThrow({ id });

		const dbClientToUse = transaction || dbClient;
		await dbClientToUse.delete(table).where(eq(table.id, id));
	};

	const count = async () => {
		const [{ count }] = await dbClient.select({ count: drizzleCount() }).from(table);
		return count;
	};

	/**
	 * @typedef {object} UpdateBulkRequest
	 * @property {string} id - The ID of the record to update.
	 * @property {object} data - The data to update the record with.
	 *
	 * @param {UpdateBulkRequest[]} request
	 */
	const updateBulk = async (updates) => {
		return processTransaction(async (transaction) => {
			const promises = updates.map(({ id, data }) => updateById({ id, data, transaction }));

			const results = await Promise.all(promises);
			return results;
		});
	};

	/**
	 * @param {object[]} dataArray
	 */
	const saveBulk = async (dataArray, options = {}) => {
		return processTransaction(async (transaction) => {
			const promises = dataArray.map((data) => save({ data, options, transaction }));

			const results = await Promise.all(promises);
			return results;
		});
	};

	/**
	 * @param {Function} processCallback
	 * @param {Function|undefined} errorCallback
	 */
	const processTransaction = async (processCallback, errorCallback) => {
		try {
			return await dbClient.transaction(async (transaction) => {
				return processCallback(transaction);
			});
		} catch (error) {
			console.error("Error processing transaction:", error);

			if (errorCallback) {
				errorCallback(error);
			}

			throw error;
		}
	};

	return {
		getConfigWithData,
		save,
		findAll,
		findAllWithPagination,
		findById,
		findByIdThrow,
		updateById,
		deleteById,
		updateBulk,
		saveBulk,
	};
};
