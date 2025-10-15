import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { corsConfig } from "@config";
import routes from "@api/routes";

const app: Hono = new Hono();

app.use("*", logger());
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
	// c.set("authService", new AuthService());
	await next();
});

// Error handling=====================================================
// registerException(app);

app.route("/", routes);

export default app;
