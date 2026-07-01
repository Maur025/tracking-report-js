import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { ZodError } from "zod";

export class ErrorHandler {
	/**
	 * @param err
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 * @param {import('express').NextFunction} next
	 */
	// eslint-disable-next-line no-unused-vars
	handler(err, req, res, next) {
		const zodError = this.zodErrorHandler({ err, res });

		if (zodError) return zodError;

		const authError = this.authorizationErrorHandler({ err, res });
		if (authError) return authError;

		console.error(err);

		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: ReasonPhrases.INTERNAL_SERVER_ERROR,
		});
	}

	/**
	 * @param {Object} request
	 * @param request.err
	 * @param {import('express').Response} request.res
	 */
	zodErrorHandler({ err, res }) {
		if (!(err instanceof ZodError)) {
			return null;
		}

		return res.status(StatusCodes.BAD_REQUEST).json({
			code: StatusCodes.BAD_REQUEST,
			message: ReasonPhrases.BAD_REQUEST,
			errors: err.format(),
		});
	}

	/**
	 * @param {Object} request
	 * @param request.err
	 * @param {import('express').Response} request.res
	 */
	authorizationErrorHandler({ err, res }) {
		if (err.name !== "UnauthorizedError") {
			return null;
		}

		return res.status(StatusCodes.UNAUTHORIZED).json({
			code: StatusCodes.UNAUTHORIZED,
			message: ReasonPhrases.UNAUTHORIZED,
		});
	}
}
