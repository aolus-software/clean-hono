import { OpenAPIHono } from "@hono/zod-openapi";
import { ResponseToolkit } from "@toolkit/response";
import { AppConfig } from "config/app.config";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { defaultHook } from "packages/errors";

const HomeRoutes = new OpenAPIHono({ defaultHook });

const HomeRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Home"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						status: z.number(),
						success: z.boolean(),
						message: z.string(),
						data: z
							.object({
								app: z.string(),
							})
							.nullable(),
					}),
				},
			},
			description: "Welcome to the API",
		},
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
						status: z.number(),
						success: z.boolean(),
						message: z.string(),
						data: z
							.object({
								status: z.string(),
								message: z.string(),
								timestamp: z.string(),
							})
							.nullable(),
					}),
				},
			},
			description: "Service is healthy",
		},
	},
});

HomeRoutes.openapi(HealthRoute, (c) => {
	return ResponseToolkit.success(
		c,
		{
			status: "ok",
			message: "Service is healthy",
			timestamp: new Date().toISOString(),
		},
		"Service is healthy",
		200,
	);
});

export default HomeRoutes;
