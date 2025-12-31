import { StrongPassword } from "@default/strong-password";
import * as z from "zod";

export const LoginSchema = z.object({
	email: z.email(),
	password: z.string().max(255),
});

export const RegisterSchema = z.object({
	name: z.string().min(3).max(255),
	email: z.email(),
	password: z.string().regex(StrongPassword),
});

export const ResendVerificationSchema = z.object({
	email: z.email(),
});

export const EmailVerificationSchema = z.object({
	token: z.string(),
});

export const ForgotPasswordSchema = z.object({
	email: z.email().max(255),
});

export const ResetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().regex(StrongPassword),
});
