import { Hash, UserInformation } from "@packages/*";
import { UpdatePasswordSchema, UpdateProfileSchema } from "./schema";
import { z } from "@hono/zod-openapi";
import { db, usersTable } from "@postgres/index";
import { and, eq, isNull } from "drizzle-orm";
import { UserRepository } from "@postgres/repositories";
import { UnauthorizedError, UnprocessableEntityError } from "packages/errors";
import { Cache, UserInformationCacheKey } from "@cache/*";

export class ProfileService {
	async updateUserProfile(
		user: UserInformation,
		data: z.infer<typeof UpdateProfileSchema>,
	): Promise<UserInformation> {
		await db
			.update(usersTable)
			.set({
				name: data.name,
				email: data.email,
				remark: data.remarks,
			})
			.where(and(eq(usersTable.id, user.id), isNull(usersTable.deleted_at)));

		const updatedUser = await UserRepository().UserInformation(user.id);
		if (!updatedUser) {
			throw new UnauthorizedError("User not found after update");
		}

		const cacheKey = UserInformationCacheKey(user.id);
		await Cache.set(cacheKey, updatedUser);

		return updatedUser;
	}

	async changeUserPassword(
		user: UserInformation,
		data: z.infer<typeof UpdatePasswordSchema>,
	): Promise<void> {
		const userData = await db.query.users.findFirst({
			where: and(eq(usersTable.id, user.id), isNull(usersTable.deleted_at)),
			columns: { password: true },
		});

		if (!userData) {
			throw new UnauthorizedError("User not found");
		}

		if (
			(await Hash.compareHash(data.current_password, userData.password)) ===
			false
		) {
			throw new UnprocessableEntityError("Current password is incorrect", [
				{
					current_password: ["Current password is incorrect"],
				},
			]);
		}

		const newHashedPassword = await Hash.generateHash(data.new_password);
		await db
			.update(usersTable)
			.set({ password: newHashedPassword })
			.where(and(eq(usersTable.id, user.id), isNull(usersTable.deleted_at)));
	}
}
