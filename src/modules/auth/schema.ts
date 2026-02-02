import * as z from "zod";
import {
	EmailSchema,
	PasswordSchema,
	StrongPasswordSchema,
	TokenSchema,
} from "@packages/schemas";

export const LoginSchema = z.object({
	email: EmailSchema,
	password: PasswordSchema,
});

export const RegisterSchema = z.object({
	name: z.string().min(3).max(255),
	email: EmailSchema,
	password: StrongPasswordSchema,
});

export const ResendVerificationSchema = z.object({
	email: EmailSchema,
});

export const EmailVerificationSchema = z.object({
	token: TokenSchema,
});

export const ForgotPasswordSchema = z.object({
	email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
	token: TokenSchema,
	password: StrongPasswordSchema,
});
