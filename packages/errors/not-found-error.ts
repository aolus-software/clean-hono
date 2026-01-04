import { AppError } from "./base.error";

export class NotFoundError extends AppError {
	statusCode = 404;
	errorCode = "NOT_FOUND";

	/**
	 * Represents an error when a resource is not found.
	 * @param {string} message - The error message.
	 * @param {unknown} details - Additional error details
	 */
	constructor(message: string = "Resource not found", details?: unknown) {
		super(message, details);
	}
}
