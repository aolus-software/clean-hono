import { logger } from "@packages/*";
import { DateToolkit } from "@toolkit/date";
import { AppConfig } from "config/app.config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { ForbiddenError } from "./forbidden-error";
import { NotFoundError } from "./not-found-error";
import { UnprocessableEntityError } from "./unprocessable-entity-error";
import { UnauthorizedError } from "./unauthorized-error";
import { formatZodError } from "./formatter";

export const registerException = (app: Hono) => {
	app.notFound((c) => {
		return c.json(
			{
				success: false,
				message: "Route not found",
				errors: [],
				data: null,
			},
			404,
		);
	});

	app.onError((err, c) => {
		if (err instanceof HTTPException && err.status === 422) {
			return c.json(
				{
					success: false,
					message: err.message,
					errors: err.cause || [],
					data: null,
				},
				422,
			);
		}

		logger.error(err, "[Internal Server Error]");

		if (err instanceof ZodError) {
			return c.json(
				{
					success: false,
					message: "Validation failed",
					errors: formatZodError(err),
					data: null,
				},
				422,
			);
		}

		if (err instanceof HTTPException) {
			// If the error is a 404 from Hono (e.g. route not found), ensure we return 404
			if (err.status === 404) {
				return c.json(
					{
						success: false,
						message: "Route not found",
						errors: [],
						data: null,
					},
					404,
				);
			}
			return c.json(
				{
					success: false,
					message: err.message,
					errors: [],
					data: null,
				},
				err.status,
			);
		}

		if (err instanceof Error) {
			if (err instanceof ForbiddenError) {
				return c.json(
					{
						success: false,
						message: err.message,
						errors: [],
						data: null,
					},
					403,
				);
			}

			if (err instanceof NotFoundError) {
				return c.json(
					{
						success: false,
						message: err.message,
						errors: [],
						data: null,
					},
					404,
				);
			}

			if (err instanceof UnprocessableEntityError) {
				return c.json(
					{
						success: false,
						message: err.message,
						errors: err.errors ?? [],
						data: null,
					},
					422,
				);
			}

			if (err instanceof UnauthorizedError) {
				return c.json(
					{
						success: false,
						message: err.message,
						errors: [],
						data: null,
					},
					401,
				);
			}
		}

		const requestContext = {
			method: c.req.method,
			url: c.req.url,
			userAgent: c.req.header("user-agent"),
			ip:
				c.req.header("x-forwarded-for") ||
				c.req.header("x-real-ip") ||
				"unknown",
			timestamp: DateToolkit.now().toISOString(),
		};

		logger.error(err, "Internal Server Error", requestContext);

		return c.json(
			{
				success: false,
				message: "Internal server error",
				errors: [],
				trace:
					err instanceof Error && AppConfig.APP_ENV !== "production"
						? err.stack
						: undefined,
				data: null,
			},
			500,
		);
	});
};
