import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	AuthMiddleware,
	ResponseToolkit,
	ZodUserInformation,
} from "@packages/*";
import { commonResponse } from "@toolkit/schemas";
import { defaultHook } from "packages/errors";
import { UpdatePasswordSchema, UpdateProfileSchema } from "./schema";
import { ProfileService } from "./service";
import { Env } from "@app/api/types/app.types";

const ProfileRoutes = new OpenAPIHono<Env>({ defaultHook });

// Apply auth middleware to all profile routes
ProfileRoutes.use("*", AuthMiddleware);

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
	const user = c.get("currentUser");

	return ResponseToolkit.success(
		c,
		user,
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
	const user = c.get("currentUser");
	const updateData = c.req.valid("json");
	const service = c.get("profileService");
	const result = await service.updateUserProfile(user, updateData);

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
	// ✨ Typed context - automatic type inference!
	const user = c.get("currentUser");

	await new ProfileService().changeUserPassword(user, c.req.valid("json"));

	return ResponseToolkit.success(
		c,
		{ message: "Password updated successfully" },
		"User password updated successfully",
		200,
	);
});

export default ProfileRoutes;
