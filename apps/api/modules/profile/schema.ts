import { z } from "@hono/zod-openapi";

export const UpdateProfileSchema = z.object({
	name: z.string().min(1).max(255),
	email: z.string().email(),
	remarks: z.string().max(255).optional(),
});

export const UpdatePasswordSchema = z.object({
	current_password: z.string().min(8).max(128),
	new_password: z.string().min(8).max(128),
});
