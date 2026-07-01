import { getReasonPhrase, StatusCodes } from "http-status-codes";

/**
 * @param {object} request
 * @param {number} request.code
 * @param {object|object[]|null} request.data
 * @param {string|null} request.message
 */
export const serverResponse = ({ code, data = null, message = null }) => {
	const statusCode = code || StatusCodes.OK;
	const reasonPhrase = getReasonPhrase(statusCode).toUpperCase();
	const messageStatus = reasonPhrase === "OK" ? "SUCCESS" : reasonPhrase;

	const response = {
		code: statusCode,
		message: messageStatus,
	};

	if (data) {
		response.data = data;
	}

	if (message) {
		response.detail = message;
	}

	return response;
};
