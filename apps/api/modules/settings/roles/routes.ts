import { authMiddleware } from "@app/api/middlewares";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ZodDatatableSchema } from "@packages/*";
import { ResponseToolkit } from "@toolkit/response";
import { commonResponse } from "@toolkit/schemas";
import {
	RoleCreateSchema,
	RoleDetailResponseSchema,
	RoleListResponseSchema,
	RoleUpdateSchema,
} from "./schema";
import { RoleService } from "./services";

const RoleRoutes = new OpenAPIHono();

RoleRoutes.use(authMiddleware);

// -------------------
// GET /settings/roles
// -------------------
const RoleGetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Settings/Roles"],
	security: [{ Bearer: [] }],
	request: {
		query: ZodDatatableSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RoleListResponseSchema,
				},
			},
			description: "List of roles",
		},
		...commonResponse(RoleListResponseSchema, "RoleGetResponse", {
			exclude: [200, 201],
		}),
	},
});

RoleRoutes.openapi(RoleGetRoute, async (c) => {
	const queryParam = c.req.valid("query");
	const roleService = new RoleService();
	const roles = await roleService.findAll(queryParam);

	return ResponseToolkit.success(c, roles, "Fetched roles successfully", 200);
});

// -------------------
// GET /settings/roles/:id
// -------------------
const RoleDetailRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Settings/Roles"],
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RoleDetailResponseSchema,
				},
			},
			description: "Role detail",
		},
		...commonResponse(RoleDetailResponseSchema, "RoleDetailResponse", {
			exclude: [200, 201],
		}),
	},
});

RoleRoutes.openapi(RoleDetailRoute, async (c) => {
	const { id } = c.req.valid("param");
	const roleService = new RoleService();
	const role = await roleService.findOne(id);

	return ResponseToolkit.success(c, role, "Fetched role successfully", 200);
});

// -------------------
// POST /settings/roles
// -------------------
const RoleCreateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Settings/Roles"],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: RoleCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z.object({}),
				},
			},
			description: "Role created successfully",
		},
		...commonResponse(z.object({}), "RoleCreateResponse", {
			exclude: [200, 201],
		}),
	},
});

RoleRoutes.openapi(RoleCreateRoute, async (c) => {
	const data = c.req.valid("json");
	const roleService = new RoleService();
	await roleService.create(data);

	return ResponseToolkit.created(c, {}, "Role created successfully");
});

// -------------------
// PUT /settings/roles/:id
// -------------------
const RoleUpdateRoute = createRoute({
	method: "put",
	path: "/{id}",
	tags: ["Settings/Roles"],
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: RoleUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({}),
				},
			},
			description: "Role updated successfully",
		},
		...commonResponse(z.object({}), "RoleUpdateResponse", {
			exclude: [200, 201],
		}),
	},
});

RoleRoutes.openapi(RoleUpdateRoute, async (c) => {
	const { id } = c.req.valid("param");
	const data = c.req.valid("json");
	const roleService = new RoleService();
	await roleService.update(data, id);

	return ResponseToolkit.success(c, {}, "Role updated successfully", 200);
});

// -------------------
// DELETE /settings/roles/:id
// -------------------
const RoleDeleteRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Settings/Roles"],
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({}),
				},
			},
			description: "Role deleted successfully",
		},
		...commonResponse(z.object({}), "RoleDeleteResponse", {
			exclude: [200, 201],
		}),
	},
});

RoleRoutes.openapi(RoleDeleteRoute, async (c) => {
	const { id } = c.req.valid("param");
	const roleService = new RoleService();
	await roleService.delete(id);

	return ResponseToolkit.success(c, {}, "Role deleted successfully", 200);
});

export default RoleRoutes;
