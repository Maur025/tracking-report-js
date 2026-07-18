export const getObjectOfString = (str) => {
	if (!str) return undefined;

	try {
		return JSON.parse(str);
	} catch (error) {
		console.error("Error parsing string to object:", error);
		return undefined;
	}
};
