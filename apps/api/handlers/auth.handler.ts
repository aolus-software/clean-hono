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

	resendVerificationSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),

	emailVerificationSchema: vine.object({
		token: vine.string(),
	}),

	forgotPasswordSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),

	resetPasswordSchema: vine.object({
		token: vine.string(),
		password: vine.string().regex(StrongPassword).confirmed(),
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

	resendVerification: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.resendVerificationSchema,
			data: payload,
		});

		await authService.resendVerification(validation);

		return ResponseToolkit.success(
			c,
			{},
			"Verification email resent successfully",
			200,
		);
	},

	verifyEmail: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.emailVerificationSchema,
			data: payload,
		});

		await authService.verifyEmail(validation);

		return ResponseToolkit.success(c, {}, "Email verified successfully", 200);
	},

	forgotPassword: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.forgotPasswordSchema,
			data: payload,
		});

		await authService.forgotPassword(validation.email);

		return ResponseToolkit.success(c, {}, "Forgot password email sent", 200);
	},

	resetPassword: async (c: Context) => {
		const payload = await c.req.json();
		const validation = await vine.validate({
			schema: AuthSchema.resetPasswordSchema,
			data: payload,
		});

		await authService.resetPassword(validation.token, validation.password);

		return ResponseToolkit.success(c, {}, "Password reset successfully", 200);
	},
};
