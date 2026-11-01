import { db } from "@database/postgres/client";
import {
	rolesTable,
	user_rolesTable,
	usersTable,
	UserStatus,
} from "@database/postgres/schema";
import { Hash } from "@utils";
import { and, eq, isNull } from "drizzle-orm";

import { SEEDED_ROLES } from "./rbac.seed";

const SEED_PASSWORD = "S3crEtP4ssw0rd!";

/**
 * One verified, active account per seeded role (`<role>@example.com`). An
 * existing live account is left untouched, so a rerun never resets a
 * password an operator has changed.
 */
export const UserSeeder = async (): Promise<void> => {
	for (const roleName of SEEDED_ROLES) {
		const email = `${roleName}@example.com`;
		const existing = await db.query.users.findFirst({
			where: and(eq(usersTable.email, email), isNull(usersTable.deleted_at)),
			columns: { id: true },
		});
		if (existing) continue;

		const role = await db.query.roles.findFirst({
			where: eq(rolesTable.name, roleName),
			columns: { id: true },
		});
		if (!role) {
			throw new Error(`Role ${roleName} is missing; run the RBAC seeder first`);
		}

		await db.transaction(async (tx) => {
			const [user] = await tx
				.insert(usersTable)
				.values({
					name: roleName,
					email,
					password: await Hash.generateHash(SEED_PASSWORD),
					status: UserStatus.ACTIVE,
					email_verified_at: new Date(),
				})
				.returning({ id: usersTable.id });
			await tx
				.insert(user_rolesTable)
				.values({ userId: user.id, roleId: role.id });
		});
	}
};
