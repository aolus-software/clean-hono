import { AppError } from "./base.error";

export class UnprocessableEntityError extends AppError {
	statusCode = 422;
	errorCode = "VALIDATION_ERROR";

	/**
	 * Represents a validation or unprocessable entity error.
	 * @param {string} message - The error message.
	 * @param {unknown} details - Validation error details
	 */
	constructor(message: string, details?: unknown) {
		super(message, details);
	}
}
