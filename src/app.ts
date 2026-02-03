import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsConfig } from "@config";
import { pinoLogger } from "hono-pino";
import bootstrap from "@modules";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import { bodyLimit } from "hono/body-limit";
import { bootstrap as bootstrapServices } from "./bootstrap";
import { Env } from "@types";
import { requestIdMiddleware } from "@hono-libs/middlewares/index";
import { logger, ResponseToolkit } from "@utils";
import { performanceMiddleware } from "@hono-libs/middlewares/index";
import { diMiddleware } from "@hono-libs/middlewares/index";
import { registerException } from "@hono-libs/errors/error.handler";

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
