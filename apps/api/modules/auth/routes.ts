import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	EmailVerificationSchema,
	ForgotPasswordSchema,
	LoginSchema,
	RegisterSchema,
	ResendVerificationSchema,
	ResetPasswordSchema,
} from "./schema";
import { AuthService } from "./service";

import { ResponseToolkit } from "@toolkit/response";
import { defaultHook } from "packages/errors";

const AuthRoutes = new OpenAPIHono({ defaultHook });

// --------------------------------
// POST /auth/login
// --------------------------------

const loginRoute = createRoute({
	method: "post",
	path: "/login",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						user: z
							.object({
								id: z.string(),
								name: z.string(),
								email: z.string(),
								email_verified_at: z.string().nullable().optional(),
								created_at: z.any(),
								updated_at: z.any(),
							})
							.passthrough(),
						token: z.string(),
					}),
				},
			},
			description: "Login successful",
		},
		422: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
			description: "Validation error",
		},
		401: {
			description: "Unauthorized",
		},
	},
});

AuthRoutes.openapi(loginRoute, async (c) => {
	const { email, password } = c.req.valid("json");
	const result = await new AuthService().login(email, password);
	return c.json(result);
});

// --------------------------------
// POST /auth/register
// --------------------------------
const registerRoute = createRoute({
	method: "post",
	path: "/register",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: RegisterSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
			description: "Registration successful",
		},
		401: {
			description: "Validation error",
		},
	},
});

AuthRoutes.openapi(registerRoute, async (c) => {
	const { name, email, password } = c.req.valid("json");
	await new AuthService().register({
		name,
		email,
		password,
	});
	return ResponseToolkit.success(c, null, "Registration successful");
});

// --------------------------------
// POST /auth/resend-verification
// --------------------------------
const resendVerificationRoute = createRoute({
	method: "post",
	path: "/resend-verification",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: ResendVerificationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Verification email sent",
		},
		401: {
			description: "Validation error",
		},
	},
});

AuthRoutes.openapi(resendVerificationRoute, async (c) => {
	const { email } = c.req.valid("json");
	await new AuthService().resendVerification({
		email,
	});
	return ResponseToolkit.success(c, null, "Verification email sent");
});

// --------------------------------
// POST /auth/verify-email
// --------------------------------
const verifyEmailRoute = createRoute({
	method: "post",
	path: "/verify-email",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: EmailVerificationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Email verified",
		},
		401: {
			description: "Validation error",
		},
	},
});

AuthRoutes.openapi(verifyEmailRoute, async (c) => {
	const { token } = c.req.valid("json");
	await new AuthService().verifyEmail({
		token,
	});
	return ResponseToolkit.success(c, null, "Email verified");
});

// --------------------------------
// POST /auth/forgot-password
// --------------------------------
const forgotPasswordRoute = createRoute({
	method: "post",
	path: "/forgot-password",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: ForgotPasswordSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Password reset email sent",
		},
		401: {
			description: "Validation error",
		},
	},
});

AuthRoutes.openapi(forgotPasswordRoute, async (c) => {
	const { email } = c.req.valid("json");
	await new AuthService().forgotPassword({
		email,
	});
	return ResponseToolkit.success(c, null, "Password reset email sent");
});

// --------------------------------
// POST /auth/reset-password
// --------------------------------
const resetPasswordRoute = createRoute({
	method: "post",
	path: "/reset-password",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: ResetPasswordSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Password reset successful",
		},
		401: {
			description: "Validation error",
		},
	},
});

AuthRoutes.openapi(resetPasswordRoute, async (c) => {
	const { token, password } = c.req.valid("json");
	await new AuthService().resetPassword({
		token,
		password,
	});
	return ResponseToolkit.success(c, null, "Password reset successful");
});

export default AuthRoutes;
