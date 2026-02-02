import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { defaultHook } from "packages/errors";
import HomeRoutes from "./home/routes";
import AuthRoutes from "./auth/routes";
import SettingsRoutes from "./settings";
import ProfileRoutes from "./profile/routes";

const bootstrap = new OpenAPIHono({ defaultHook });

bootstrap.route("/", HomeRoutes);
bootstrap.route("/profile", ProfileRoutes);
bootstrap.route("/auth", AuthRoutes);
bootstrap.route("/settings", SettingsRoutes);

bootstrap.doc("/docs/openapi.json", {
	openapi: "3.0.0",
	info: {
		title: "Clean Hono API",
		version: "1.0.0",
		description: "Clean Architecture API built with Hono",
	},
	servers: [{ url: "/", description: "Development" }],
});

bootstrap.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
	type: "http",
	scheme: "bearer",
	description:
		"Bearer token authentication. Can be obtained via the /auth/login endpoint.",
});

bootstrap.get(
	"/docs",
	Scalar({
		theme: "mars",
		layout: "modern",
		pageTitle: "Clean Hono API Documentation",
		url: "/docs/openapi.json",
	}),
);

export default bootstrap;
