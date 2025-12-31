import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

const PermissionRoutes = new OpenAPIHono();

// -------------------
// GET settings/permissions
// -------------------
const PermissionGetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Settings"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
			description: "Permissions list",
		},
		401: {
			description: "Unauthorized",
		},
		403: {
			description: "Forbidden",
		},
		500: {
			description: "Internal Server Error",
		},
	},
});

PermissionRoutes.openapi(PermissionGetRoute, (c) => {
	return c.json({});
});

export default PermissionRoutes;
