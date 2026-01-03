import { OpenAPIHono } from "@hono/zod-openapi";
import { ResponseToolkit } from "@toolkit/response";
import { AppConfig } from "config/app.config";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { defaultHook } from "packages/errors";
import { commonResponse, createErrorResponse } from "@toolkit/schemas";
import { db } from "@postgres/index";
import { RedisClient } from "infra/redis/redis-client";
import { ClickHouseClientManager } from "infra/clickhouse";
import { DateToolkit } from "@toolkit/date";

const HomeRoutes = new OpenAPIHono({ defaultHook });

const HomeRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Home"],
	responses: {
		...commonResponse(
			z.object({
				app: z.string(),
			}),
			"Welcome to the API",
			{ exclude: [201, 422, 402, 404, 403] },
		),
	},
});

HomeRoutes.openapi(HomeRoute, (c) => {
	return ResponseToolkit.success(
		c,
		{
			app: AppConfig.APP_NAME,
		},
		"Welcome to the API",
		200,
	);
});

const HealthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Home"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean().openapi({ example: true }),
						message: z.string().openapi({ example: "Service is healthy" }),
						data: z.object({
							status: z.string(),
							message: z.string(),
							timestamp: z.string(),
						}),
					}),
				},
			},
			description: "Service is healthy",
		},
		503: createErrorResponse(
			"Service is unhealthy",
			"Service is unhealthy",
			false,
		),
	},
});

HomeRoutes.openapi(HealthRoute, async (c) => {
	try {
		await db.execute("SELECT 1");
	} catch {
		return ResponseToolkit.serviceUnavailable(
			c,
			"Database service is unavailable",
		);
	}

	try {
		await RedisClient.getRedisClient().ping();
	} catch {
		return ResponseToolkit.serviceUnavailable(
			c,
			"Redis service is unavailable",
		);
	}

	try {
		await RedisClient.getQueueRedisClient().ping();
	} catch {
		return ResponseToolkit.serviceUnavailable(
			c,
			"Redis Queue service is unavailable",
		);
	}

	try {
		await ClickHouseClientManager.getInstance().ping();
	} catch {
		return ResponseToolkit.serviceUnavailable(
			c,
			"ClickHouse service is unavailable",
		);
	}

	return ResponseToolkit.success(
		c,
		{
			status: "ok",
			message: "Service is healthy",
			timestamp: DateToolkit.getDateTimeInformativeWithTimezone(
				DateToolkit.now(),
			),
		},
		"Service is healthy",
		200,
	);
});

export default HomeRoutes;
