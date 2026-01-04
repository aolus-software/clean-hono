import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsConfig } from "@config";
import { pinoLogger } from "hono-pino";
import { logger, ResponseToolkit } from "@packages";
import bootstrap from "./modules";
import { registerException } from "packages/errors";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import type { Env } from "./types/app.types";

const app = new Hono<Env>();

app.use(
	"*",
	pinoLogger({
		pino: logger,
	}),
);

// Bind services to context===========================================
app.use("*", async (c, next) => {
	await next();
});

// Rate limit, cors, helmet =======================================================
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

app.use(
	secureHeaders({
		contentSecurityPolicy: {},
		contentSecurityPolicyReportOnly: {},
		crossOriginEmbedderPolicy: true,
		crossOriginOpenerPolicy: true,
		crossOriginResourcePolicy: true,
		originAgentCluster: true,
		referrerPolicy: "no-referrer",
		strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
		xContentTypeOptions: true,
		permissionsPolicy: {},
		removePoweredBy: true,
	}),
);
app.use(
	rateLimiter({
		windowMs: 15 * 60 * 1000,
		limit: 100,
		keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
		message: "Too many requests, please try again later.",
		handler: (c) => ResponseToolkit.error(c, "Too Many Requests", 429),
	}),
);

// Error handling=====================================================
registerException(app);

app.route("/", bootstrap);

export default app;
