import { getReasonPhrase, StatusCodes } from "http-status-codes";

/**
 * @typedef {object} PaginationResponse
 * @param {number} pages
 * @param {number} count
 */

/**
 * @param {object} request
 * @param {number} request.code
 * @param {object|object[]|null} request.data
 * @param {string|null} request.message
 * @param {PaginationResponse|null} request.pagination
 */
export const serverResponse = ({ code, data = null, message = null, pagination = null }) => {
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

	if (pagination) {
		response.pagination = pagination;
	}

	if (message) {
		response.detail = message;
	}

	return response;
};
