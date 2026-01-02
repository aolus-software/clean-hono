import { authMiddleware } from "@app/api/middlewares";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	ResponseToolkit,
	UserInformation,
	ZodUserInformation,
} from "@packages/*";
import { commonResponse } from "@toolkit/schemas";
import { defaultHook } from "packages/errors";
import { UpdatePasswordSchema, UpdateProfileSchema } from "./schema";
import { ProfileService } from "./service";

const ProfileRoutes = new OpenAPIHono({ defaultHook });

// Apply auth middleware to all profile routes
ProfileRoutes.use("*", authMiddleware);

// --------------------------------
// GET /profile
// --------------------------------
const GetProfileRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Profile"],
	security: [
		{
			Bearer: [],
		},
	],
	responses: {
		...commonResponse(
			ZodUserInformation,
			"User profile retrieved successfully",
			{
				exclude: [201, 422, 402, 404, 403],
			},
		),
	},
});

ProfileRoutes.openapi(GetProfileRoute, (c) => {
	const user: UserInformation | null = c.get("currentUser");
	if (!user) {
		return ResponseToolkit.error(c, "Unauthorized", 401);
	}

	return ResponseToolkit.success(
		c,
		c.get("currentUser"),
		"User profile retrieved successfully",
		200,
	);
});

// --------------------------------
// PUT /profile
// --------------------------------
const UpdateProfileRoute = createRoute({
	method: "put",
	path: "",
	tags: ["Profile"],
	security: [
		{
			Bearer: [],
		},
	],
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdateProfileSchema,
				},
			},
		},
	},
	responses: {
		...commonResponse(ZodUserInformation, "User profile updated successfully", {
			exclude: [201, 402, 404, 403],
			validationErrors: {
				name: ["Name is required"],
				email: ["Invalid email format"],
			},
		}),
	},
});

ProfileRoutes.openapi(UpdateProfileRoute, async (c) => {
	const user: UserInformation | null = c.get("currentUser");
	if (!user) {
		return ResponseToolkit.error(c, "Unauthorized", 401);
	}

	const updateData = c.req.valid("json");
	const result = await new ProfileService().updateUserProfile(user, updateData);

	return ResponseToolkit.success(
		c,
		result,
		"User profile updated successfully",
		200,
	);
});

const UpdatePasswordRoute = createRoute({
	method: "put",
	path: "/password",
	tags: ["Profile"],
	security: [
		{
			Bearer: [],
		},
	],
	request: {
		body: {
			content: {
				"application/json": {
					schema: UpdatePasswordSchema,
				},
			},
		},
	},
	responses: {
		...commonResponse(
			z.object({
				message: z
					.string()
					.openapi({ example: "Password updated successfully" }),
			}),
			"User password updated successfully",
			{
				exclude: [201, 402, 404, 403],
				validationErrors: {
					current_password: ["Current password is required"],
				},
			},
		),
	},
});

ProfileRoutes.openapi(UpdatePasswordRoute, async (c) => {
	const user: UserInformation | null = c.get("currentUser");
	if (!user) {
		return ResponseToolkit.error(c, "Unauthorized", 401);
	}

	await new ProfileService().changeUserPassword(user, c.req.valid("json"));

	return ResponseToolkit.success(
		c,
		{ message: "Password updated successfully" },
		"User password updated successfully",
		200,
	);
});

export default ProfileRoutes;
