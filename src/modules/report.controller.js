import { StatusCodes } from "http-status-codes";
import { serverResponse } from "../core/server-response.js";

export class ReportController {
	#resource = "reports";

	constructor() {}

	/** @param {import('express').Application} app*/
	registerRoutes(app, basePath) {
		app.get(`${basePath}/${this.#resource}`, this.#handleDefaultGet.bind(this));
	}

	/**
	 * @param {import('express').Request} req
	 * @param {import('express').Response} res
	 */
	#handleDefaultGet(req, res) {
		console.log(req.params);

		return res.status(StatusCodes.OK).json(
			serverResponse({
				code: StatusCodes.OK,
				message: "reports endpoint working!",
			}),
		);
	}
}
