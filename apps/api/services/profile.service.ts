import { db, usersTable } from "@postgres/index";
import { UserInformation } from "../types/UserInformation";
import { UserRepository } from "../repositories";
import { UnprocessableEntityError } from "../errors";
import { Hash } from "@security/hash";
import { and, eq, ne } from "drizzle-orm";

export const ProfileService = {
	updateProfile: async (
		userInformation: UserInformation,
		payload: {
			name: string;
			email: string;
		},
	): Promise<UserInformation> => {
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, payload.email),
					ne(usersTable.id, userInformation.id),
				),
			)
			.limit(1);

		if (isEmailExist.length > 0) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email already in use.",
				},
			]);
		}

		await db.transaction(async (tx) => {
			return await tx
				.update(usersTable)
				.set({
					name: payload.name,
					email: payload.email,
				})
				.where(eq(usersTable.id, userInformation.id))
				.returning();
		});

		const user: UserInformation = await UserRepository().UserInformation(
			userInformation.id,
		);

		// const userCacheKey = UserInformationCacheKey(userInformation.id);
		// await Cache.delete(userCacheKey);
		// await Cache.set(userCacheKey, user, 60 * 60);

		return user;
	},

	updatePassword: async (
		userInformation: UserInformation,
		payload: {
			current_password: string;
			new_password: string;
		},
	): Promise<void> => {
		await db.transaction(async (tx) => {
			const user = await UserRepository().findByEmail(userInformation.email);
			if (!user) {
				throw new UnprocessableEntityError("User not found", [
					{
						field: "user",
						message: "The user does not exist",
					},
				]);
			}

			const isOldPasswordValid = await Hash.compareHash(
				payload.current_password,
				user.password,
			);
			if (!isOldPasswordValid) {
				throw new UnprocessableEntityError("Invalid old password", [
					{
						field: "current_password",
						message: "The old password is incorrect",
					},
				]);
			}

			const hashedNewPassword = await Hash.generateHash(payload.new_password);

			await tx
				.update(usersTable)
				.set({
					password: hashedNewPassword,
				})
				.where(eq(usersTable.id, user.id));
		});
	},
};
