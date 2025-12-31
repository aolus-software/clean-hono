import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ResponseToolkit {
	static success<T, Status extends ContentfulStatusCode = 200>(
		ctx: Context,
		data: T | null,
		message: string = "Success",
		statusCode: Status = 200 as Status,
	) {
		return ctx.json(
			{
				status: statusCode,
				success: true,
				message,
				data,
			},
			{ status: statusCode },
		);
	}

	static error<Status extends ContentfulStatusCode = 400>(
		ctx: Context,
		message: string,
		statusCode: Status = 400 as Status,
	) {
		return ctx.json(
			{
				status: statusCode,
				success: false,
				message,
			},
			{ status: statusCode },
		);
	}

	static notFound(ctx: Context, message: string = "Resource not found") {
		return this.error(ctx, message, 404);
	}

	static unauthorized(ctx: Context, message: string = "Unauthorized") {
		return this.error(ctx, message, 401);
	}

	static response<T, Status extends ContentfulStatusCode = 200>(
		ctx: Context,
		success: boolean,
		data: T | null,
		message: string = "Success",
		statusCode: Status = 200 as Status,
	) {
		return ctx.json(
			{
				status: statusCode,
				success,
				message,
				data,
			},
			{ status: statusCode },
		);
	}

	static validationError<Status extends ContentfulStatusCode = 422>(
		ctx: Context,
		errors: { [key: string]: string }[],
		message: string = "Validation failed",
		statusCode: Status = 422 as Status,
	) {
		return ctx.json(
			{
				status: statusCode,
				success: false,
				message,
				errors,
			},
			{ status: statusCode },
		);
	}
}
