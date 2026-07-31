/**
 *
 * @param {object} request
 * @param {string} request.databaseName
 * @param {ReturnType<typeof import('../../../modules/enterprise/enterprise-config-db.repository.js').enterpriseConfigDbRepository>} request.enterpriseConfigDbRepository
 */
export const getDatabaseConfig = ({ enterpriseConfigDbRepository }) => {
	const { findByDatabase } = enterpriseConfigDbRepository;

	const getConfig = async ({ databaseName }) => {
		if (!databaseName) {
			throw new Error("Database name is required");
		}

		const databaseConfig = await findByDatabase({ database: databaseName });

		if (!databaseConfig) {
			throw new Error(`Database configuration not found for database: ${databaseName}`);
		}

		if (!databaseConfig.host || !databaseConfig.port) {
			throw new Error(`Database configuration is incomplete for database: ${databaseName}`);
		}

		return {
			host: `http://${databaseConfig.host}:${databaseConfig.port}`,
			enterprise: {
				name: databaseConfig.enterprise?.name || null,
				image: databaseConfig.enterprise?.image || null,
				color: databaseConfig.enterprise?.color || null,
			},
		};
	};

	return { getConfig };
};
