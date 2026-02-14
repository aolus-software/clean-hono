import { Hono } from "hono";
import bootstrap from "@modules";
import { bootstrap as bootstrapServices } from "./bootstrap";
import { Env } from "@types";
import {
	requestIdMiddleware,
	loggerMiddleware,
	performanceMiddleware,
	diMiddleware,
	corsMiddleware,
	securityHeadersMiddleware,
	rateLimiterMiddleware,
	bodyLimitMiddleware,
} from "@hono-libs/middlewares/index";
import { registerException } from "@hono-libs/errors/error.handler";

const app = new Hono<Env>();

// Bootstrap services
bootstrapServices();

// Core Middleware =========================================
// Request ID middleware - first to ensure all requests have an ID
app.use("*", requestIdMiddleware);

// Logger middleware
app.use("*", loggerMiddleware);

// Performance logging
app.use("*", performanceMiddleware);

// Dependency injection - bind services to context
app.use("*", diMiddleware);

// Security Middleware =========================================
// Body size limits
app.use("*", bodyLimitMiddleware);

// CORS configuration
app.use("*", corsMiddleware);

// Security headers (CSP, HSTS, etc.)
app.use(securityHeadersMiddleware);

// Rate limiting
app.use(rateLimiterMiddleware);

// Error handling=====================================================
registerException(app);

// Routes =========================================
app.route("/", bootstrap);

export default app;
