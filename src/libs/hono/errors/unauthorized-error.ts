import { AppError } from "./base.error";

export class UnauthorizedError extends AppError {
	statusCode = 401;
	errorCode = "UNAUTHORIZED";

	/**
	 * Represents an error when a user is not authenticated or has invalid credentials.
	 * @param {string} message - The error message.
	 * @param {unknown} details - Additional error details
	 */
	constructor(message = "Unauthorized", details?: unknown) {
		super(message, details);
	}
}
