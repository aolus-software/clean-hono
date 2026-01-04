import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	EmailVerificationSchema,
	ForgotPasswordSchema,
	LoginSchema,
	RegisterSchema,
	ResendVerificationSchema,
	ResetPasswordSchema,
} from "./schema";

import { ResponseToolkit } from "@toolkit/response";
import { defaultHook } from "packages/errors";
import { commonResponse } from "@toolkit/schemas";
import { ZodUserInformation } from "@packages/*";
import { Env } from "@app/api/types/app.types";

const AuthRoutes = new OpenAPIHono<Env>({ defaultHook });

// --------------------------------
// POST /auth/login
// --------------------------------

const loginDataSchema = z.object({
	user: ZodUserInformation,
	token: z.string(),
});

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
		...commonResponse(loginDataSchema, "Login successful", {
			exclude: [201, 403, 404],
			validationErrors: {
				email: ["Email not found", "Email format is invalid"],
				password: ["Incorrect password"],
			},
		}),
	},
});

AuthRoutes.openapi(loginRoute, async (c) => {
	const { email, password } = c.req.valid("json");
	const service = c.get("authService");
	const result = await service.login(email, password);
	return ResponseToolkit.success<z.infer<typeof loginDataSchema>, 200>(
		c,
		result,
		"Login successful",
		200,
	);
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
		...commonResponse(z.null(), "Registration successful", {
			exclude: [200, 403, 404],
			validationErrors: {
				email: ["Email is already in use", "Email format is invalid"],
				password: ["Password must be at least 8 characters"],
			},
		}),
	},
});

AuthRoutes.openapi(registerRoute, async (c) => {
	const { name, email, password } = c.req.valid("json");
	const service = c.get("authService");
	await service.register({
		name,
		email,
		password,
	});

	return ResponseToolkit.success<null, 201>(
		c,
		null,
		"Registration successful",
		201,
	);
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
		...commonResponse(z.null(), "Verification email sent", {
			exclude: [200, 403, 404],
			validationErrors: {
				email: ["Email is already verified", "Email format is invalid"],
			},
		}),
	},
});

AuthRoutes.openapi(resendVerificationRoute, async (c) => {
	const { email } = c.req.valid("json");
	const service = c.get("authService");
	await service.resendVerification({
		email,
	});

	return ResponseToolkit.success<null, 200>(c, null, "Verification email sent");
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
		...commonResponse(z.null(), "Email verified", {
			exclude: [200, 403, 404],
			validationErrors: {
				token: ["Invalid or expired token"],
			},
		}),
	},
});

AuthRoutes.openapi(verifyEmailRoute, async (c) => {
	const { token } = c.req.valid("json");
	const service = c.get("authService");
	await service.verifyEmail({ token });

	return ResponseToolkit.success<null, 200>(c, null, "Email verified", 200);
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
		...commonResponse(z.null(), "Password reset email sent", {
			exclude: [201, 403, 404],
			validationErrors: {
				email: ["Email not found", "Email format is invalid"],
			},
		}),
	},
});

AuthRoutes.openapi(forgotPasswordRoute, async (c) => {
	const { email } = c.req.valid("json");
	const service = c.get("authService");
	await service.forgotPassword({
		email,
	});

	return ResponseToolkit.success<null, 200>(
		c,
		null,
		"Password reset email sent",
		200,
	);
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
		...commonResponse(z.null(), "Password reset successful", {
			exclude: [201, 403, 404],
			validationErrors: {
				token: ["Invalid or expired token"],
				password: ["Password must be at least 8 characters"],
			},
		}),
	},
});

AuthRoutes.openapi(resetPasswordRoute, async (c) => {
	const { token, password } = c.req.valid("json");
	const service = c.get("authService");
	await service.resetPassword({
		token,
		password,
	});

	return ResponseToolkit.success<null, 200>(
		c,
		null,
		"Password reset successful",
		200,
	);
});

export default AuthRoutes;
