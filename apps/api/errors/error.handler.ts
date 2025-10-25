// import { isProduction } from "@configs/app.config";
// import { DateToolkit, LoggerUtils } from "@utils/index";
import { logger } from "@packages/*";
import { DateToolkit } from "@toolkit/date";
import { errors } from "@vinejs/vine";
import { AppConfig } from "config/app.config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ForbiddenError } from "./forbidden-error";
import { NotFoundError } from "./not-found-error";
import { UnprocessableEntityError } from "./unprocessable-entity-error";
import { UnauthorizedError } from "./unauthorized-error";

export const registerException = (app: Hono) => {
	app.onError((err, c) => {
		if (err instanceof HTTPException && err.status === 422) {
			return c.json(
				{
					status: false,
					message: err.message,
					errors: err.cause || [],
					data: null,
				},
				422,
			);
		}

		if (err instanceof errors.E_VALIDATION_ERROR) {
			const errorMessages = (
				err.messages as { field: string; message: string }[]
			).map((msg: { field: string; message: string }) => ({
				field: msg.field,
				message: msg.message,
			}));

			return c.json(
				{
					status: 422,
					success: false,
					message: errorMessages[0].message || "Validation err",
					errors: errorMessages,
				},
				422,
			);
		}

		if (err instanceof HTTPException) {
			return c.json(
				{
					status: false,
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
						status: false,
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
						status: false,
						message: err.message,
						errors: [],
						data: null,
					},
					422,
				);
			}

			if (err instanceof UnprocessableEntityError) {
				return c.json(
					{
						status: false,
						message: err.message,
						errors: err.error || [],
						data: null,
					},
					422,
				);
			}

			if (err instanceof UnauthorizedError) {
				return c.json(
					{
						status: false,
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
				status: false,
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
