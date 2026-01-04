import { z } from "@hono/zod-openapi";
import {
	EmailSchema,
	NameSchema,
	OptionalRemarksSchema,
	PasswordSchema,
} from "@packages/schemas";

export const UpdateProfileSchema = z.object({
	name: NameSchema,
	email: EmailSchema,
	remarks: OptionalRemarksSchema,
});

export const UpdatePasswordSchema = z.object({
	current_password: PasswordSchema,
	new_password: PasswordSchema,
});
