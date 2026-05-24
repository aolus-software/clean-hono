import { UpdatePasswordSchema, UpdateProfileSchema } from "./schema";
import { z } from "@hono/zod-openapi";
import { db, usersTable, UserRepository } from "@database";
import { and, eq, isNull } from "drizzle-orm";
import { UnauthorizedError, UnprocessableEntityError } from "@errors";
import { Cache, UserInformationCacheKey } from "@cache";
import type { IProfileService } from "./service.interface";
import { UserInformation } from "@types";
import { Hash } from "@utils";
import { t } from "@i18n";

export class ProfileService implements IProfileService {
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
			throw new UnauthorizedError(t("profile.userNotFound"));
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
			throw new UnauthorizedError(t("profile.userNotFound"));
		}

		if (
			(await Hash.compareHash(data.current_password, userData.password)) ===
			false
		) {
			throw new UnprocessableEntityError(
				t("profile.currentPasswordIncorrect"),
				[
					{
						current_password: [t("profile.currentPasswordIncorrect")],
					},
				],
			);
		}

		const newHashedPassword = await Hash.generateHash(data.new_password);
		await db
			.update(usersTable)
			.set({ password: newHashedPassword })
			.where(and(eq(usersTable.id, user.id), isNull(usersTable.deleted_at)));
	}
}
