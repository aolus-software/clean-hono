import { authMiddleware } from "@app/api/middlewares";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ZodDatatableSchema } from "@packages/*";
import { ResponseToolkit } from "@toolkit/response";
import { commonResponse } from "@toolkit/schemas";
import {
	UserCreateSchema,
	UserDetailResponseSchema,
	UserListResponseSchema,
	UserUpdateSchema,
} from "./schema";
import { UserService } from "./services";

const UserRoutes = new OpenAPIHono();

UserRoutes.use(authMiddleware);

// -------------------
// GET /settings/users
// -------------------
const UserGetRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	request: {
		query: ZodDatatableSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserListResponseSchema,
				},
			},
			description: "List of users",
		},
		...commonResponse(UserListResponseSchema, "UserGetResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserGetRoute, async (c) => {
	const queryParam = c.req.valid("query");
	const userService = new UserService();
	const users = await userService.findAll(queryParam);

	return ResponseToolkit.success(c, users, "Fetched users successfully", 200);
});

// -------------------
// GET /settings/users/:id
// -------------------
const UserDetailRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Settings/Users"],
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
					schema: UserDetailResponseSchema,
				},
			},
			description: "User detail",
		},
		...commonResponse(UserDetailResponseSchema, "UserDetailResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserDetailRoute, async (c) => {
	const { id } = c.req.valid("param");
	const userService = new UserService();
	const user = await userService.findOne(id);

	return ResponseToolkit.success(c, user, "Fetched user successfully", 200);
});

// -------------------
// POST /settings/users
// -------------------
const UserCreateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: UserCreateSchema,
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
			description: "User created successfully",
		},
		...commonResponse(z.object({}), "UserCreateResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserCreateRoute, async (c) => {
	const data = c.req.valid("json");
	const userService = new UserService();
	await userService.create(data);

	return ResponseToolkit.created(c, {}, "User created successfully");
});

// -------------------
// PUT /settings/users/:id
// -------------------
const UserUpdateRoute = createRoute({
	method: "put",
	path: "/{id}",
	tags: ["Settings/Users"],
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		body: {
			content: {
				"application/json": {
					schema: UserUpdateSchema,
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
			description: "User updated successfully",
		},
		...commonResponse(z.object({}), "UserUpdateResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserUpdateRoute, async (c) => {
	const { id } = c.req.valid("param");
	const data = c.req.valid("json");
	const userService = new UserService();
	await userService.update(data, id);

	return ResponseToolkit.success(c, {}, "User updated successfully", 200);
});

// -------------------
// DELETE /settings/users/:id
// -------------------
const UserDeleteRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Settings/Users"],
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
			description: "User deleted successfully",
		},
		...commonResponse(z.object({}), "UserDeleteResponse", {
			exclude: [200, 201],
		}),
	},
});

UserRoutes.openapi(UserDeleteRoute, async (c) => {
	const { id } = c.req.valid("param");
	const userService = new UserService();
	await userService.delete(id);

	return ResponseToolkit.success(c, {}, "User deleted successfully", 200);
});

export default UserRoutes;
