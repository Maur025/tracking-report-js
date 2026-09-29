import { iocContainer } from "../../../src/config/ioc/ioc-container.js";

export const seedEnterpriseConfig = async () => {
	/** @type {ReturnType<typeof import("../../../src/modules/enterprise/enterprise.repository.js").enterpriseRepository>} */
	const { save: saveEnterprise } = iocContainer.resolve("enterpriseRepository");

	/** @type {ReturnType<typeof import("../../../src/modules/enterprise/enterprise-config-db.repository.js").enterpriseConfigDbRepository>} */
	const { save: saveEnterpriseConfig } = iocContainer.resolve("enterpriseConfigDbRepository");

	const enterpriseId = "enterprise-1";

	await saveEnterprise({
		data: {
			id: enterpriseId,
			name: "Enterprise test",
			description: "Enterprise test description",
			color: "#FF0000",
			image: "",
		},
	});

	await saveEnterpriseConfig({
		data: {
			host: "event-api-test",
			port: "80",
			database: "enterprise_1_db",
			referenceId: "db1",
			enterpriseRefId: enterpriseId,
		},
	});
};
