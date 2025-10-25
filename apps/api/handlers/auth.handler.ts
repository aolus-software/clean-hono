import { StrongPassword } from "@default/strong-password";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { JWTToolkit } from "@toolkit/jwt";

const AuthSchema = {
	loginSchema: vine.object({
		email: vine.string().email(),
		password: vine.string(),
	}),

	registerSchema: vine.object({
		name: vine.string().maxLength(255),
		email: vine.string().email().maxLength(255),
		password: vine.string().regex(StrongPassword).confirmed(),
	}),

	emailVerificationSchema: vine.object({
		token: vine.string().uuid(),
	}),

	forgotPasswordSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),

	resetPasswordSchema: vine.object({
		token: vine.string().uuid(),
		newPassword: vine.string().regex(StrongPassword).confirmed(),
	}),
};

const authService = AuthService;

export const AuthHandler = {
	login: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.loginSchema,
			data: payload,
		});

		const user = await authService.login(validation);
		const token = await new JWTToolkit().sign({ userId: user.id });

		return ResponseToolkit.success(
			c,
			{ user, accessToken: token },
			"Login successful",
			200,
		);
	},

	register: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.registerSchema,
			data: payload,
		});

		await authService.register(validation);

		return ResponseToolkit.success(
			c,
			{},
			"Registration successful, please verify your email address",
			201,
		);
	},

	verifyEmail: (c: Context) => {
		return ResponseToolkit.success(c, {}, "Verify email endpoint", 200);
	},

	forgotPassword: (c: Context) => {
		return ResponseToolkit.success(c, {}, "Forgot password endpoint", 200);
	},

	resetPassword: (c: Context) => {
		return ResponseToolkit.success(c, {}, "Reset password endpoint", 200);
	},
};
