import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsConfig } from "@config";
import { pinoLogger } from "hono-pino";
import { logger } from "@packages";
import bootstrap from "./modules";
import { registerException } from "packages/errors";

const app: Hono = new Hono();

app.use(
	"*",
	pinoLogger({
		pino: logger,
	}),
);

app.use(
	"*",
	cors({
		origin: corsConfig.origin,
		allowMethods: corsConfig.methods,
		allowHeaders: corsConfig.allowedHeaders,
		exposeHeaders: corsConfig.exposedHeaders,
		maxAge: corsConfig.maxAge,
		credentials: corsConfig.credentials,
	}),
);

// Bind services to context===========================================
app.use("*", async (c, next) => {
	await next();
});

// Error handling=====================================================
registerException(app);

app.route("/", bootstrap);

export default app;
