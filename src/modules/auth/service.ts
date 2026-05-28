import {
	UserRepository,
	db,
	email_verificationsTable,
	password_reset_tokensTable,
	usersTable,
} from "@database";
import { JWTToolkit, Hash, StrToolkit } from "@utils";
import { AppConfig } from "@config";
import { eq } from "drizzle-orm";
import type { IAuthService } from "./service.interface";
import { UserInformation } from "@types";
import { UnprocessableEntityError } from "@errors";
import { verificationTokenLifetime } from "@default";
import { sendEmailQueue } from "@bull";
import { ForgotPasswordRepository } from "@database";
import { t, getCurrentLocale } from "@i18n";

export class AuthService implements IAuthService {
	async login(
		email: string,
		password: string,
	): Promise<{
		user: UserInformation;
		token: string;
	}> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			throw new UnprocessableEntityError(t("auth.invalidCredentials"), [
				{
					email: [t("auth.invalidCredentials")],
				},
			]);
		}

		if (!user.email_verified_at || user.email_verified_at === null) {
			throw new UnprocessableEntityError(t("auth.emailNotVerified"), [
				{
					email: [t("auth.emailNotVerified")],
				},
			]);
		}

		if (user.status !== "active") {
			throw new UnprocessableEntityError(t("auth.accountInactive"), [
				{
					email: [t("auth.accountInactive")],
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(password, user.password);
		if (!isPasswordValid) {
			throw new UnprocessableEntityError(t("auth.invalidCredentials"), [
				{
					password: [t("auth.invalidCredentials")],
				},
			]);
		}

		const userInformation = await UserRepository().UserInformation(user.id);
		const token = await new JWTToolkit().sign({ userId: user.id });
		return { user: userInformation, token };
	}

	async register(data: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> {
		const user = await UserRepository().findByEmail(data.email);
		if (user) {
			throw new UnprocessableEntityError(t("auth.userAlreadyExists"), [
				{
					email: [t("auth.userAlreadyExists")],
				},
			]);
		}

		const hashedPassword = await Hash.generateHash(data.password);
		await db.transaction(async (trx) => {
			const newUser = await trx
				.insert(usersTable)
				.values({
					name: data.name,
					email: data.email,
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
				subject: t("mail.subject.verification"),
				to: data.email,
				template: "/auth/email-verification",
				lang: getCurrentLocale(),
				variables: {
					user_id: newUser[0].id,
					user_name: newUser[0].name,
					user_email: newUser[0].email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});
	}

	async resendVerification(data: { email: string }): Promise<void> {
		const user = await UserRepository().findByEmail(data.email);
		if (!user) {
			return;
		}

		if (user.email_verified_at !== null) {
			throw new UnprocessableEntityError(t("auth.emailAlreadyVerified"), [
				{
					email: [t("auth.emailAlreadyVerified")],
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
				subject: t("mail.subject.verification"),
				to: data.email,
				template: "/auth/email-verification",
				lang: getCurrentLocale(),
				variables: {
					user_id: user.id,
					user_name: user.name,
					user_email: user.email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});
	}

	async verifyEmail(data: { token: string }): Promise<void> {
		const verificationRecord = await db
			.select()
			.from(email_verificationsTable)
			.where(eq(email_verificationsTable.token, data.token))
			.limit(1)
			.then((res) => res[0]);

		if (!verificationRecord) {
			throw new UnprocessableEntityError(t("auth.invalidVerificationToken"), [
				{
					token: [t("auth.invalidVerificationToken")],
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
				.where(
					eq(email_verificationsTable.user_id, verificationRecord.user_id),
				);
		});
	}

	async forgotPassword(data: { email: string }): Promise<void> {
		const user = await UserRepository().db.query.users.findFirst({
			where: eq(usersTable.email, data.email),
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
			subject: t("mail.subject.resetPassword"),
			to: data.email,
			template: "/auth/forgot-password",
			lang: getCurrentLocale(),
			variables: {
				user_id: user.id,
				user_name: user.name,
				user_email: user.email,
				reset_password_url: `${AppConfig.CLIENT_URL}/auth/reset-password?token=${token}`,
			},
		});
	}

	async resetPassword(data: {
		token: string;
		password: string;
	}): Promise<void> {
		const forgotPasswordRecord = await db.query.password_reset_tokens.findFirst(
			{
				where: eq(password_reset_tokensTable.token, data.token),
			},
		);
		if (!forgotPasswordRecord) {
			throw new UnprocessableEntityError(t("auth.invalidResetPasswordToken"), [
				{
					token: [t("auth.invalidResetPasswordToken")],
				},
			]);
		}

		await db.transaction(async (trx) => {
			await trx
				.update(usersTable)
				.set({ password: data.password })
				.where(eq(usersTable.id, forgotPasswordRecord.user_id));

			await trx
				.delete(password_reset_tokensTable)
				.where(
					eq(password_reset_tokensTable.user_id, forgotPasswordRecord.user_id),
				);
		});
	}
}
