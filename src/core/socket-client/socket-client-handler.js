import { NodeControllerClient, NodeControllerServer } from "tracking-common";
import { Scheduler } from "./scheduler.cjs";

/**
 *
 * @param {object} request
 * @param {ReturnType<typeof import('../../modules/enterprise/enterprise-config-db.repository.js').enterpriseConfigDbRepository>} request.enterpriseConfigDbRepository
 */
export const socketClientHandler = async ({ environment, enterpriseConfigDbRepository }) => {
	const { saveBulk } = enterpriseConfigDbRepository;

	const scheduler = new Scheduler();

	const wsClientGateway = new NodeControllerClient({
		host: environment.WS_GATEWAY_HOST_PROCESSOR,
		port: environment.WS_GATEWAY_PORT_PROCESSOR,
		type: "tracking-report",
		extra: {
			//portUdp: environment.UDP_PORT,
			//portTcp: environment.TCP_PORT,
			//portWs: environment.WS_PORT,
			portHttp: environment.APP_PORT,
		},
	});

	const wsServerOutput = new NodeControllerServer({
		port: environment.WS_PORT,
		prefix: "ws-processor-output",
	});

	const setupOutput = async () => {
		wsServerOutput.wsServerManager.on("connected", (client, data) => {
			console.error("wsServerOutput.wsServerManager on connected", data);
			client.socket.emit("devices", []);
		});
	};

	const setupScheduler = async () => {
		scheduler.on("time.ping", () => {});
		scheduler.on("time.save", () => {
			console.log("saving");
		});
		scheduler.on("time.storage", () => {});
	};

	const setupGatewayClient = async () => {
		wsClientGateway.wsClientManager.on("enterprises", async (socket, uuid, _enterprises) => {
			console.log("wsClientGateway.wsClientManager enterprises", _enterprises);

			const enterprisesToSave = [];

			for (const enterprise of _enterprises) {
				const port = enterprise.database?.server.apiPort
					? String(enterprise.database?.server.apiPort)
					: null;

				const enterpriseData = {
					host: enterprise.database?.server?.address || null,
					port: port,
					database: enterprise.database?.codename || null,
					referenceId: enterprise.database?.id || null,
					enterpriseRefId: enterprise.id || null,
				};

				if (
					!enterpriseData.host ||
					!enterpriseData.port ||
					!enterpriseData.database ||
					!enterpriseData.referenceId ||
					!enterpriseData.enterpriseRefId
				) {
					continue;
				}

				enterprisesToSave.push(enterpriseData);
			}

			await saveBulk(enterprisesToSave, {
				setTarget: (table) => [table.database, table.referenceId, table.enterpriseRefId],
			});

			//enterprises = _enterprises;
			//wsClientGateway.wsClientManager.socket.emit("processor.all",backends);
		});
		// wsClientGateway.on("devices.subscribe", (subscriptions) => {
		// 	console.log("wsClientGateway.subscriptions", subscriptions);
		// });
		// wsClientGateway.on("devices.unsubscribe.all", (subscriptions) => {
		// 	console.log("wsClientGateway.devices.unsubscribe.all", subscriptions);
		// 	wsClientGateway.wsClientManager.socket.emit("processor.all", subscriptions);
		// });
	};

	return {
		scheduler,
		wsClientGateway,
		wsServerOutput,
		setupScheduler,
		setupOutput,
		setupGatewayClient,
	};
};
