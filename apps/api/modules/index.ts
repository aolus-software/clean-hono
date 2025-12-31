import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { defaultHook } from "packages/errors";
import HomeRoutes from "./home/route";
import AuthRoutes from "./auth/routes";
import SettingsRoutes from "./settings";

const bootstrap = new OpenAPIHono({ defaultHook });

bootstrap.route("/", HomeRoutes);
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
