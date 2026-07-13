const PING_INTERVAL_MS = process.env.PING_INTERVAL_MS;
const STORAGE_INTERVAL_HRS = process.env.STORAGE_INTERVAL_HRS * 60 * 60 * 1000;
const SAVE_INTERVAL_MIN = process.env.SAVE_INTERVAL_MIN * 60 * 1000;

// eslint-disable-next-line no-unused-vars
function pad(n) {
	return (n + "").padStart(2, "0");
}
class Scheduler {
	constructor() {
		this.events = { "time.ping": [], "time.save": [], "time.storage": [] };
	}
	// eslint-disable-next-line no-unused-vars
	on(ev, fn, ...args) {
		if (this.events[ev] == undefined) this.events[ev] = [];
		this.events[ev].push(fn);
	}
	start() {
		// eslint-disable-next-line no-unused-vars
		const self = this;
		/*const schedulerWorker = new Worker('./libx/workers/scheduler.worker.js', {
			workerData: { timerEach: 5000 }
		});

		schedulerWorker.on("message", (message) => {
			if (message.command == "schedule.ping") {
				self.events['time.ping'].forEach(fn => fn(message.payload));
			}
			if (message.command == "schedule.save") {
				self.events['time.save'].forEach(fn => fn(message.payload));
			}
			if (message.command == "schedule.storage") {
				self.events['time.storage'].forEach(fn => fn(message.payload));
			}
		});*/

		this.setupIntervals();
	}
	setupIntervals() {
		const self = this;

		setInterval(() => {
			//parentPort.postMessage({ command: "schedule.ping", payload: PING_INTERVAL_MS });
			self.events["time.ping"].forEach((fn) => fn(PING_INTERVAL_MS));
		}, PING_INTERVAL_MS);

		setInterval(() => {
			//parentPort.postMessage({ command: "schedule.save", payload: SAVE_INTERVAL_MIN });
			self.events["time.save"].forEach((fn) => fn(SAVE_INTERVAL_MIN));
		}, SAVE_INTERVAL_MIN);

		setInterval(() => {
			//parentPort.postMessage({ command: "schedule.storage", payload: STORAGE_INTERVAL_HRS });
			self.events["time.storage"].forEach((fn) => fn(STORAGE_INTERVAL_HRS));
		}, STORAGE_INTERVAL_HRS);
	}
}

module.exports = { Scheduler };
