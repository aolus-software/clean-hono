export class UnprocessableEntityError extends Error {
	code: number;
	errors: {
		[key: string]: string[];
	}[];

	/**
	 * Represents an error when a user is not authorized to access a resource.
	 * @param {string} message - The error message.
	 */
	constructor(message: string, errors: { [key: string]: string[] }[]) {
		super(message);
		this.name = "UnprocessableEntityError";
		this.code = 422;
		this.errors = errors;
	}
}
