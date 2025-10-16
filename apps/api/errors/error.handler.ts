import { isProduction } from "@configs/app.config";
import { DateUtils, LoggerUtils } from "@utils/index";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

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

		const requestContext = {
			method: c.req.method,
			url: c.req.url,
			userAgent: c.req.header("user-agent"),
			ip:
				c.req.header("x-forwarded-for") ||
				c.req.header("x-real-ip") ||
				"unknown",
			timestamp: DateUtils.now().toISOString(),
		};

		LoggerUtils.error("Internal Server Error", err, requestContext);

		return c.json(
			{
				status: false,
				message: "Internal server error",
				errors: [],
				trace: err instanceof Error && !isProduction ? err.stack : undefined,
				data: null,
			},
			500,
		);
	});
};
