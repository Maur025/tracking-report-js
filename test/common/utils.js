export const binaryParser = (res, callback) => {
	const chunks = [];

	res.on("data", (chunk) => {
		chunks.push(chunk);
	});

	res.on("end", () => {
		callback(null, Buffer.concat(chunks));
	});
};
