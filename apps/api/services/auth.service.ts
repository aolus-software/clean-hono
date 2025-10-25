import { Hash } from "@security/hash";
import { UnprocessableEntityError } from "../errors";
import { UserRepository } from "../repositories";
import { UserInformation } from "../types/UserInformation";
import {
	db,
	email_verificationsTable,
	password_reset_tokensTable,
	usersTable,
} from "@postgres/index";
import { StrToolkit } from "@toolkit/string";
import { verificationTokenLifetime } from "@default/token-lifetime";
import { AppConfig } from "config/app.config";
import { and, eq, isNull } from "drizzle-orm";
import { sendEmailQueue } from "@app/worker/queue/send-email.queue";
import { ForgotPasswordRepository } from "../repositories/forgot-password.repository";

export const AuthService = {
	login: async (payload: {
		email: string;
		password: string;
	}): Promise<UserInformation> => {
		const user = await UserRepository().findByEmail(payload.email);
		if (!user) {
			throw new UnprocessableEntityError("Invalid credentials", [
				{
					field: "email",
					message: "Email not found",
				},
			]);
		}

		if (user.email_verified_at === null) {
			throw new UnprocessableEntityError("Email not verified", [
				{
					field: "email",
					message: "Please verify your email before logging in",
				},
			]);
		}

		if (user.status !== "active") {
			throw new UnprocessableEntityError("Account inactive", [
				{
					field: "email",
					message: "Your account is not active. Please contact support.",
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(
			payload.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new UnprocessableEntityError("Invalid credentials", [
				{
					field: "password",
					message: "Incorrect password",
				},
			]);
		}

		return await UserRepository().UserInformation(user.id);
	},

	register: async (payload: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> => {
		const user = await UserRepository().db.query.users.findFirst({
			where: and(
				eq(usersTable.email, payload.email),
				isNull(usersTable.deleted_at),
			),
		});

		if (user) {
			throw new UnprocessableEntityError("Email already in use", [
				{
					field: "email",
					message: "The provided email is already registered",
				},
			]);
		}

		// Hash the password
		const hashedPassword = await Hash.generateHash(payload.password);
		await db.transaction(async (trx) => {
			const newUser = await trx
				.insert(usersTable)
				.values({
					name: payload.name,
					email: payload.email,
					password: hashedPassword,
					status: "active",
				})
				.returning();

			const token = StrToolkit.random(255);
			await trx.insert(email_verificationsTable).values({
				token,
				user_id: newUser[0].id,
				expired_at: verificationTokenLifetime,
			});

			await sendEmailQueue.add("send-email", {
				subject: "Email verification",
				to: payload.email,
				template: "/auth/email-verification",
				variables: {
					user_id: newUser[0].id,
					user_name: newUser[0].name,
					user_email: newUser[0].email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});
	},

	resendVerification: async (payload: { email: string }): Promise<void> => {
		const user = await UserRepository().findByEmail(payload.email);
		if (!user) {
			return;
		}

		if (user.email_verified_at !== null) {
			throw new UnprocessableEntityError("Email already verified", [
				{
					field: "email",
					message: "This email has already been verified",
				},
			]);
		}

		const token = StrToolkit.random(255);
		await db.transaction(async (trx) => {
			await trx.insert(email_verificationsTable).values({
				token,
				user_id: user.id,
				expired_at: verificationTokenLifetime,
			});

			await sendEmailQueue.add("send-email", {
				subject: "Email verification",
				to: payload.email,
				template: "/auth/email-verification",
				variables: {
					user_id: user.id,
					user_name: user.name,
					user_email: user.email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});
	},

	verifyEmail: async (payload: { token: string }): Promise<void> => {
		const verificationRecord = await db
			.select()
			.from(email_verificationsTable)
			.where(eq(email_verificationsTable.token, payload.token))
			.limit(1)
			.then((res) => res[0]);

		if (!verificationRecord) {
			throw new UnprocessableEntityError("Invalid verification token", [
				{
					field: "token",
					message: "The provided verification token is invalid",
				},
			]);
		}

		await db.transaction(async (trx) => {
			await trx
				.update(usersTable)
				.set({ email_verified_at: new Date() })
				.where(eq(usersTable.id, verificationRecord.user_id));

			await trx
				.delete(email_verificationsTable)
				.where(eq(email_verificationsTable.id, verificationRecord.id));
		});
	},

	async forgotPassword(email: string): Promise<void> {
		const user = await UserRepository().db.query.users.findFirst({
			where: eq(usersTable.email, email),
		});
		if (!user) {
			return;
		}

		const token = StrToolkit.random(255);
		await ForgotPasswordRepository().create({
			user_id: user.id,
			token,
		});

		await sendEmailQueue.add("send-email", {
			subject: "Reset Password",
			to: email,
			template: "/auth/forgot-password",
			variables: {
				user_id: user.id,
				user_name: user.name,
				user_email: user.email,
				reset_password_url: `${AppConfig.CLIENT_URL}/auth/reset-password?token=${token}`,
			},
		});
	},

	async resetPassword(token: string, newPassword: string): Promise<void> {
		const passwordReset = await ForgotPasswordRepository().findByToken(token);
		if (!passwordReset) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired password reset token",
				},
			]);
		}

		const user = await UserRepository().db.query.users.findFirst({
			where: eq(usersTable.id, passwordReset.user_id),
		});
		if (!user) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired password reset token",
				},
			]);
		}

		const hashPassword = await Hash.generateHash(newPassword);
		await db.transaction(async (trx) => {
			await trx
				.update(usersTable)
				.set({
					password: hashPassword,
				})
				.where(eq(usersTable.id, user.id));

			await trx
				.delete(password_reset_tokensTable)
				.where(eq(password_reset_tokensTable.user_id, user.id));
		});
	},
};
