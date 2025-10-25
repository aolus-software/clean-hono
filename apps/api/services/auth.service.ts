import { Hash } from "@security/hash";
import { UnprocessableEntityError } from "../errors";
import { UserRepository } from "../repositories";
import { UserInformation } from "../types/UserInformation";
import { db, usersTable } from "@postgres/index";

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
		// Check if email already exists
		const existingUser = await UserRepository().findByEmail(payload.email);
		if (existingUser) {
			throw new UnprocessableEntityError("Email already in use", [
				{
					field: "email",
					message:
						"This email is already registered. Please use a different email.",
				},
			]);
		}

		// Hash the password
		const hashedPassword = await Hash.generateHash(payload.password);
		await db.transaction(async (trx) => {
			await trx
				.insert(usersTable)
				.values({
					name: payload.name,
					email: payload.email,
					password: hashedPassword,
					status: "active",
				})
				.returning();

			// const token = StrToolkit.random(255);
			// await trx.insert(email_verificationsTable).values({
			// 	token,
			// 	user_id: newUser[0].id,
			// 	expired_at: verificationTokenLifetime,
			// });

			// TODO: Send verification email here
			// await sendEmailQueue.add("send-email", {
			// 	subject: "Email verification",
			// 	to: payload.email,
			// 	template: "/auth/email-verification",
			// 	variables: {
			// 		user_id: newUser[0].id,
			// 		user_name: newUser[0].name,
			// 		user_email: newUser[0].email,
			// 		verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
			// 	},
			// });
		});

		// Create the user
		// const newUser = await UserRepository().create({
		// 	name: payload.name,
		// 	email: payload.email,
		// 	password: hashedPassword,
		// });
	},
};
