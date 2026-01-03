import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ResponseToolkit } from "@toolkit/response";
import { commonResponse } from "@toolkit/schemas";
import {
	PermissionSelectOptionsResponseSchema,
	RoleSelectOptionsResponseSchema,
} from "./schema";
import { SelectOptionsService } from "./services";
import { AuthMiddleware } from "@packages/*";

const SelectOptionsRoutes = new OpenAPIHono();

SelectOptionsRoutes.use(AuthMiddleware);

// -------------------
// GET /settings/select-options/permissions
// -------------------
const PermissionSelectOptionsRoute = createRoute({
	method: "get",
	path: "/permissions",
	tags: ["Settings/Select Options"],
	security: [{ Bearer: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PermissionSelectOptionsResponseSchema,
				},
			},
			description: "Permission select options",
		},
		...commonResponse(
			PermissionSelectOptionsResponseSchema,
			"PermissionSelectOptionsResponse",
			{
				exclude: [200, 201],
			},
		),
	},
});

SelectOptionsRoutes.openapi(PermissionSelectOptionsRoute, async (c) => {
	const service = new SelectOptionsService();
	const options = await service.getPermissionOptions();

	return ResponseToolkit.success(
		c,
		options,
		"Fetched permission options successfully",
		200,
	);
});

// -------------------
// GET /settings/select-options/roles
// -------------------
const RoleSelectOptionsRoute = createRoute({
	method: "get",
	path: "/roles",
	tags: ["Settings/Select Options"],
	security: [{ Bearer: [] }],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: RoleSelectOptionsResponseSchema,
				},
			},
			description: "Role select options",
		},
		...commonResponse(
			RoleSelectOptionsResponseSchema,
			"RoleSelectOptionsResponse",
			{
				exclude: [200, 201],
			},
		),
	},
});

SelectOptionsRoutes.openapi(RoleSelectOptionsRoute, async (c) => {
	const service = new SelectOptionsService();
	const options = await service.getRoleOptions();

	return ResponseToolkit.success(
		c,
		options,
		"Fetched role options successfully",
		200,
	);
});

export default SelectOptionsRoutes;
