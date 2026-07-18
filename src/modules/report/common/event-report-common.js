const getEventDescription = (inout, label, outConector, inConector) =>
	inout === "out"
		? `Salió ${outConector} ${label}`
		: inout === "in"
			? `Ingresó ${inConector} ${label}`
			: `Ingresó/Salió ${outConector} ${label}`;

const caseIpoints = (inout, geofence) => {
	const description = getEventDescription(inout, "punto de interés", "del", "al");

	return {
		eventName: "Puntos de Interés",
		eventDetail: `${description} ${geofence ?? "N/A"}`,
	};
};

const caseGeofences = (inout, geofence) => {
	const description = getEventDescription(inout, "geocerca", "de la", "a la");

	return {
		eventName: "Geocerca",
		eventDetail: `${description} ${geofence ?? "N/A"}`,
	};
};

const caseSensors = (devent, conditionOperator, conditionValue, value) => ({
	eventName: "Sensor",
	eventDetail: `${devent} ${conditionOperator} ${conditionValue ?? "N/A"}, con el valor ${value ?? "N/A"}`,
});

export const getEventValues = ({
	eventName,
	inout,
	geofence,
	conditionOperator,
	conditionValue,
	devent,
	value,
}) => {
	switch (eventName) {
		case "IPOINTS": {
			return caseIpoints(inout, geofence);
		}
		case "GEOFENCES": {
			return caseGeofences(inout, geofence);
		}
		case "SENSORS": {
			return caseSensors(devent, conditionOperator, conditionValue, value);
		}
		default: {
			return { eventName: "N/A", eventDetail: "N/A" };
		}
	}
};
