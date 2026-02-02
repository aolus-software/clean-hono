import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsConfig } from "@config";
import { pinoLogger } from "hono-pino";
import { logger, ResponseToolkit } from "@packages";
import bootstrap from "./modules";
import { registerException } from "packages/errors";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import { bodyLimit } from "hono/body-limit";
import type { Env } from "./libs/types/app.types";
import { bootstrap as bootstrapServices } from "./bootstrap";
import { diMiddleware } from "packages/middlewares/di.middleware";
import { requestIdMiddleware } from "@packages/middlewares/request-id.middleware";
import { performanceMiddleware } from "@packages/middlewares/performance.middleware";

const app = new Hono<Env>();

// Bootstrap services
bootstrapServices();

// Request ID middleware - first to ensure all requests have an ID
app.use("*", requestIdMiddleware);

app.use(
	"*",
	pinoLogger({
		pino: logger,
	}),
);

// Performance logging
app.use("*", performanceMiddleware);

// Bind services to context===========================================
app.use("*", diMiddleware);

// Body size limits =========================================
app.use("*", bodyLimit({ maxSize: 100 * 1024 })); // 100KB

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
