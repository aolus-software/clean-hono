import { AppError } from "./base.error";

export class ForbiddenError extends AppError {
	statusCode = 403;
	errorCode = "FORBIDDEN";

	/**
	 * Represents an error when a user is forbidden from accessing a resource.
	 * @param {string} message - The error message.
	 * @param {unknown} details - Additional error details
	 */
	constructor(message = "Forbidden", details?: unknown) {
		super(message, details);
	}
}
